// PayPal 捕获订单 API
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

  const { orderId } = body;
  
  if (!orderId) {
    return jsonResp({ error: '缺少订单ID' }, 400);
  }

  try {
    const accessToken = await getAccessToken(env);

    // 捕获 PayPal 订单
    const response = await fetch(`${PAYPAL_CONFIG.apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('PayPal capture error:', error);
      return jsonResp({ error: '支付确认失败' }, 500);
    }

    const captureData = await response.json();
    
    // 检查支付状态
    const purchaseUnit = captureData.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    
    if (!capture || capture.status !== 'COMPLETED') {
      return jsonResp({ error: '支付未完成' }, 400);
    }

    // 从 custom_id 中提取用户ID和方案
    const customId = purchaseUnit?.custom_id || '';
    const [userId, planId] = customId.split(':');
    
    if (!userId || !planId || parseInt(userId) !== payload.id) {
      return jsonResp({ error: '订单信息不匹配' }, 400);
    }

    const plan = PLANS[planId];
    if (!plan) {
      return jsonResp({ error: '无效的订阅方案' }, 400);
    }

    // 计算过期时间
    let expiresAt = null;
    const now = new Date();
    
    if (planId === 'lifetime') {
      // 终身会员设置一个很远的过期时间
      expiresAt = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
    } else if (planId === 'yearly') {
      expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else if (planId === 'monthly') {
      expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    // 数据库事务：更新用户和订阅记录
    try {
      // 1. 更新用户表
      await env.DB.prepare(`
        UPDATE users 
        SET is_pro = 1, 
            subscription_type = ?, 
            subscription_status = 'active',
            pro_expires_at = ?,
            paypal_order_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(planId, expiresAt.toISOString(), orderId, payload.id).run();

      // 2. 更新订阅记录
      await env.DB.prepare(`
        UPDATE subscriptions 
        SET paypal_order_id = ?, 
            status = 'active',
            started_at = CURRENT_TIMESTAMP,
            expires_at = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND status = 'pending'
        ORDER BY id DESC LIMIT 1
      `).bind(orderId, expiresAt.toISOString(), payload.id).run();
    } catch (dbError) {
      console.error('Database update error:', dbError);
      // 即使数据库更新失败，也返回支付成功，后续通过 Webhook 修复
    }

    return jsonResp({
      success: true,
      plan: planId,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('PayPal capture error:', error);
    return jsonResp({ error: '支付确认失败' }, 500);
  }
}
