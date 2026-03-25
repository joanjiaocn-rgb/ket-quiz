// PayPal Webhook 处理 API
import { json as jsonResp, cors as corsResp } from '../../_utils.js';
import { PAYPAL_CONFIG, PLANS, verifyWebhookSignature } from './config.js';

export async function onRequestOptions() { return corsResp(); }

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    // 1. 记录 Webhook 事件
    const eventId = event.id;
    const eventType = event.event_type;

    console.log(`Received PayPal webhook: ${eventType} (${eventId})`);

    // 检查是否已处理过
    try {
      const existing = await env.DB.prepare(
        'SELECT id FROM paypal_webhooks WHERE event_id = ?'
      ).bind(eventId).first();

      if (existing) {
        console.log(`Webhook ${eventId} already processed`);
        return jsonResp({ success: true });
      }
    } catch (e) {
      // 表可能不存在，继续处理
    }

    // 2. 记录到数据库
    try {
      await env.DB.prepare(`
        INSERT INTO paypal_webhooks (event_id, event_type, event_data, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(eventId, eventType, JSON.stringify(event)).run();
    } catch (e) {
      console.error('Failed to save webhook:', e);
      // 即使保存失败也继续处理
    }

    // 3. 验证 Webhook 签名
    const isValid = await verifyWebhookSignature(request, env);
    if (!isValid) {
      console.error('Invalid webhook signature');
      try {
        await env.DB.prepare(`
          UPDATE paypal_webhooks 
          SET processed = -1, error_message = 'Invalid signature', processed_at = CURRENT_TIMESTAMP
          WHERE event_id = ?
        `).bind(eventId).run();
      } catch (e) {}
      return jsonResp({ error: 'Invalid signature' }, 400);
    }

    // 4. 处理不同类型的事件
    let processed = false;
    let errorMessage = null;

    try {
      switch (eventType) {
        case 'CHECKOUT.ORDER.COMPLETED':
          await handleOrderCompleted(event, env);
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          await handleCaptureCompleted(event, env);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await handleCaptureRefunded(event, env);
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await handleSubscriptionCancelled(event, env);
          break;
        case 'BILLING.SUBSCRIPTION.EXPIRED':
          await handleSubscriptionExpired(event, env);
          break;
        default:
          console.log(`Unhandled event type: ${eventType}`);
      }
      processed = true;
    } catch (handlerError) {
      console.error(`Error handling ${eventType}:`, handlerError);
      processed = false;
      errorMessage = handlerError.message;
    }

    // 5. 更新处理状态
    try {
      await env.DB.prepare(`
        UPDATE paypal_webhooks 
        SET processed = ?, error_message = ?, processed_at = CURRENT_TIMESTAMP
        WHERE event_id = ?
      `).bind(processed ? 1 : -1, errorMessage, eventId).run();
    } catch (e) {}

    return jsonResp({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return jsonResp({ error: 'Webhook processing failed' }, 500);
  }
}

// 处理订单完成
async function handleOrderCompleted(event, env) {
  const resource = event.resource;
  const purchaseUnit = resource.purchase_units?.[0];
  const customId = purchaseUnit?.custom_id || '';
  const [userId, planId] = customId.split(':');
  const orderId = resource.id;

  if (!userId || !planId) return;

  const plan = PLANS[planId];
  if (!plan) return;

  // 计算过期时间
  let expiresAt = null;
  const now = new Date();
  
  if (planId === 'lifetime') {
    expiresAt = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
  } else if (planId === 'yearly') {
    expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  } else if (planId === 'monthly') {
    expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  // 更新用户状态
  await env.DB.prepare(`
    UPDATE users 
    SET is_pro = 1, 
        subscription_type = ?, 
        subscription_status = 'active',
        pro_expires_at = ?,
        paypal_order_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(planId, expiresAt.toISOString(), orderId, parseInt(userId)).run();

  // 更新订阅记录
  await env.DB.prepare(`
    UPDATE subscriptions 
    SET paypal_order_id = ?, 
        status = 'active',
        started_at = CURRENT_TIMESTAMP,
        expires_at = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND status = 'pending'
    ORDER BY id DESC LIMIT 1
  `).bind(orderId, expiresAt.toISOString(), parseInt(userId)).run();
}

// 处理支付捕获完成
async function handleCaptureCompleted(event, env) {
  // 类似于 handleOrderCompleted
  await handleOrderCompleted(event, env);
}

// 处理退款
async function handleCaptureRefunded(event, env) {
  const resource = event.resource;
  // 这里可以实现退款逻辑
  console.log('Payment refunded:', resource.id);
}

// 处理订阅取消
async function handleSubscriptionCancelled(event, env) {
  const resource = event.resource;
  const subscriptionId = resource.id;

  await env.DB.prepare(`
    UPDATE users 
    SET subscription_status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
    WHERE paypal_subscription_id = ?
  `).bind(subscriptionId).run();

  await env.DB.prepare(`
    UPDATE subscriptions 
    SET status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE paypal_subscription_id = ?
  `).bind(subscriptionId).run();
}

// 处理订阅过期
async function handleSubscriptionExpired(event, env) {
  const resource = event.resource;
  const subscriptionId = resource.id;

  await env.DB.prepare(`
    UPDATE users 
    SET is_pro = 0,
        subscription_status = 'expired',
        pro_expires_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE paypal_subscription_id = ?
  `).bind(subscriptionId).run();

  await env.DB.prepare(`
    UPDATE subscriptions 
    SET status = 'expired',
        expires_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE paypal_subscription_id = ?
  `).bind(subscriptionId).run();
}
