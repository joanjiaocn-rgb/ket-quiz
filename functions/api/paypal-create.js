// PayPal 创建订单 API
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
  const auth = Buffer.from(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`).toString('base64');
  
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
  console.log('PayPal create order API called');
  
  const authHeader = request.headers.get('Authorization');
  console.log('Auth header:', authHeader ? 'present' : 'missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid auth header');
    return jsonResp({ error: '未登录' }, 401);
  }

  let payload;
  try {
    const token = authHeader.split(' ')[1];
    console.log('Verifying token...');
    payload = await verifyJwt(token);
    console.log('Token verified, user id:', payload?.id);
  } catch (e) {
    console.error('Token verification failed:', e);
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
    const accessToken = await getAccessToken();
    
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: plan.name,
          amount: {
            currency_code: plan.currency,
            value: plan.price.toFixed(2),
          },
          custom_id: `${payload.id}:${planId}`,
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

    console.log('Creating PayPal order:', orderPayload);

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
    console.log('PayPal order created:', order);
    
    try {
      await env.DB.prepare(`
        INSERT INTO subscriptions (user_id, plan_type, amount, currency, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `).bind(payload.id, planId, plan.price, plan.currency).run();
    } catch (dbError) {
      console.error('Database error:', dbError);
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
