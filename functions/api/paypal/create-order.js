// PayPal 创建订单 API
import { verifyJwt, json as jsonResp, cors as corsResp } from '../../_utils.js';
import { PAYPAL_CONFIG, PLANS, getAccessToken } from './config.js';

export async function onRequestOptions() { return corsResp(); }

export async function onRequestPost({ request, env }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResp({ error: '未登录' }, 401);
  }

  let payload;
  try {
    payload = await verifyJwt(authHeader.split(' ')[1]);
  } catch {
    return jsonResp({ error: 'token 无效' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResp({ error: '请求格式错误' }, 400);
  }

  const { planId } = body;
  const plan = PLANS[planId];
  
  if (!plan) {
    return jsonResp({ error: '无效的订阅方案' }, 400);
  }

  try {
    const accessToken = await getAccessToken(env);
    
    // 构建 PayPal 订单
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: plan.name,
          amount: {
            currency_code: plan.currency,
            value: plan.price.toFixed(2),
          },
          custom_id: `${payload.id}:${planId}`, // 存储用户ID和方案ID
        },
      ],
      application_context: {
        brand_name: 'KET 冲刺小站',
        locale: 'zh-CN',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${new URL(request.url).origin}/payment-success`,
        cancel_url: `${new URL(request.url).origin}/payment-cancelled`,
      },
    };

    const response = await fetch(`${PAYPAL_CONFIG.apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('PayPal create order error:', error);
      return jsonResp({ error: '创建订单失败' }, 500);
    }

    const order = await response.json();
    
    // 在数据库中创建待处理的订阅记录
    try {
      await env.DB.prepare(`
        INSERT INTO subscriptions (user_id, plan_type, amount, currency, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `).bind(payload.id, planId, plan.price, plan.currency).run();
    } catch (dbError) {
      console.error('Database error:', dbError);
      // 即使数据库失败，也返回 PayPal 订单，后续通过 Webhook 修复
    }

    return jsonResp({
      orderId: order.id,
      approvalLink: order.links.find(link => link.rel === 'approve')?.href,
    });

  } catch (error) {
    console.error('PayPal error:', error);
    return jsonResp({ error: '支付服务暂时不可用' }, 500);
  }
}
