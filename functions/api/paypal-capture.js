// PayPal 捕获订单 API（简化版）
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
  console.log('=== paypal-capture API called ===');
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResp({ error: '未登录' }, 401);
  }

  let payload;
  try {
    const token = authHeader.split(' ')[1];
    payload = await verifyJwt(token);
  } catch {
    return jsonResp({ error: 'token 无效' }, 401);
  }

  console.log('1. Token verified, user id:', payload?.id);

  try {
    const bodyText = await request.text();
    console.log('2. Raw body:', bodyText);

    let body;
    try {
      body = JSON.parse(bodyText);
      console.log('3. Parsed body:', JSON.stringify(body));
    } catch (e) {
      console.error('JSON parse error:', e);
      return jsonResp({ error: 'JSON解析失败', raw: bodyText }, 400);
    }

    const orderId = body.orderId || body.orderID;
    console.log('4. Extracted orderId:', orderId);

    if (!orderId) {
      console.error('5. No orderId found!');
      return jsonResp({ error: '缺少订单ID', body: body }, 400);
    }

    console.log('6. All checks passed, proceeding with capture...');

    const accessToken = await getAccessToken();

    // 1. 先获取订单详情，获取 custom_id
    console.log('6. Fetching order details for:', orderId);
    const orderDetailsResponse = await fetch(`${PAYPAL_CONFIG.apiBase}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!orderDetailsResponse.ok) {
      const error = await orderDetailsResponse.text();
      console.error('PayPal get order error:', error);
      return jsonResp({ error: '获取订单信息失败' }, 500);
    }

    const orderDetails = await orderDetailsResponse.json();
    console.log('7. Order details:', JSON.stringify(orderDetails));

    const purchaseUnit = orderDetails.purchase_units?.[0];
    const customId = purchaseUnit?.custom_id || '';
    console.log('8. Custom ID from order details:', customId);

    // 2. 解析 custom_id 获取 planId
    let planId = 'monthly'; // 默认
    if (customId) {
      const parts = customId.split(':');
      if (parts[1]) planId = parts[1];
    }
    console.log('9. Using planId:', planId);

    // 3. 执行捕获
    console.log('10. Capturing order...');
    const captureResponse = await fetch(`${PAYPAL_CONFIG.apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      console.error('PayPal capture error:', error);
      return jsonResp({ error: '支付确认失败' }, 500);
    }

    const captureData = await captureResponse.json();
    console.log('11. PayPal capture success:', captureData?.id);

    const capture = purchaseUnit?.payments?.captures?.[0];

    const captureStatus = captureData.status;
    console.log('12. Capture status:', captureStatus);
    
    if (captureStatus !== 'COMPLETED') {
      return jsonResp({ error: '支付未完成', status: captureStatus }, 400);
    }

    const plan = PLANS[planId] || PLANS.monthly;
    console.log('13. Plan found:', plan.name);

    let expiresAt = null;
    const now = new Date();

    if (planId === 'lifetime') {
      expiresAt = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
    } else if (planId === 'yearly') {
      expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else if (planId === 'monthly') {
      expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    console.log('14. Expires at:', expiresAt?.toISOString());

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
      console.log('15. User updated');

      await env.DB.prepare(`
        INSERT OR REPLACE INTO subscriptions (user_id, paypal_order_id, plan_type, amount, currency, status, started_at, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(payload.id, orderId, planId, plan.price, plan.currency, expiresAt.toISOString()).run();
      console.log('16. Subscription created/updated');
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    console.log('17. All done, returning success');
    return jsonResp({
      success: true,
      plan: planId,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('=== paypal-capture ERROR ===', error);
    return jsonResp({ error: '服务器错误', details: String(error) }, 500);
  }
}
