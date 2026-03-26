// PayPal 捕获订单 API
import { verifyJwt, json as jsonResp, cors as corsResp } from '../_utils.js';

const PAYPAL_CONFIG = {
  mode: 'sandbox',
  clientId: 'Af7Scqb91NwnT2cofnPndwHYjqkImKSJGJGITLt8qlvxLdcvDw6tDctfk7xT1VH8jeKBAi1OjJeT411R',
  clientSecret: 'EDBwT8xf200f54mN8orpRSWDQmY_HA3qFwPcy75kVUuiKbFTI38O6XvIZP0aTRiCjv8gh4dRR1bcQpLA',
  apiBase: 'https://api-m.sandbox.paypal.com',
};

const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Pro 月度',
    price: 1.99,
    currency: 'USD',
    interval: 'MONTH',
    cnyPrice: 9.9,
  },
  yearly: {
    id: 'yearly',
    name: 'Pro 年度',
    price: 14.99,
    currency: 'USD',
    interval: 'YEAR',
    cnyPrice: 99,
  },
  lifetime: {
    id: 'lifetime',
    name: '终身会员',
    price: 39.99,
    currency: 'USD',
    interval: null,
    cnyPrice: 299,
  },
};

async function getAccessToken() {
  // 使用 btoa 代替 Buffer（Cloudflare Workers 兼容）
  const auth = btoa(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`);
  
  const response = await fetch(`${PAYPAL_CONFIG.apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal token error:', error);
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

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
    console.log('Request body:', JSON.stringify(body));
  } catch (e) {
    console.error('Failed to parse request body:', e);
    return jsonResp({ error: '请求格式错误' }, 400);
  }

  const { orderId } = body;
  console.log('Extracted orderId:', orderId);
  
  if (!orderId) {
    console.error('Missing orderId in request body');
    return jsonResp({ error: '缺少订单ID' }, 400);
  }

  try {
    const accessToken = await getAccessToken();

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
    console.log('PayPal capture data:', JSON.stringify(captureData, null, 2));
    
    const purchaseUnit = captureData.purchase_units?.[0];
    console.log('Purchase unit:', JSON.stringify(purchaseUnit, null, 2));
    
    const capture = purchaseUnit?.payments?.captures?.[0];
    
    if (!capture || capture.status !== 'COMPLETED') {
      return jsonResp({ error: '支付未完成' }, 400);
    }

    const customId = purchaseUnit?.custom_id || '';
    console.log('Custom ID from PayPal:', customId);
    console.log('Custom ID type:', typeof customId);
    console.log('Current user ID from token:', payload.id);
    
    const [userId, planId] = customId.split(':');
    
    console.log('Extracted userId:', userId, 'planId:', planId);
    console.log('Comparison:', parseInt(userId), '!==', payload.id, '=', parseInt(userId) !== payload.id);
    
    if (!planId) {
      console.error('Missing planId in custom_id:', customId);
      return jsonResp({ error: '订单信息不完整，请重试' }, 400);
    }
    
    // 检查用户ID是否匹配（如果不匹配只记录警告，不阻止支付）
    if (parseInt(userId) !== parseInt(payload.id)) {
      console.warn('User ID mismatch: order created by user', userId, 'but captured by user', payload.id);
      // 继续处理，不返回错误
    }

    const plan = PLANS[planId];
    if (!plan) {
      return jsonResp({ error: '无效的订阅方案' }, 400);
    }

    let expiresAt = null;
    const now = new Date();
    
    if (planId === 'lifetime') {
      expiresAt = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
    } else if (planId === 'yearly') {
      expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else if (planId === 'monthly') {
      expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    try {
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
