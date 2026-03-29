// PayPal 创建订阅 API - 支持首月优惠
import { verifyJwt, json as jsonResp, cors as corsResp } from '../_utils.js';
import { PAYPAL_CONFIG, PLANS, getAccessToken } from './paypal-config.js';

export async function onRequestOptions() { return corsResp(); }

export async function onRequestPost({ request, env }) {
  console.log('PayPal create order API called');
  console.log('Environment check:', {
    hasEnv: !!env,
    envType: typeof env,
    envKeys: env ? Object.keys(env) : [],
    hasPayPalClientId: !!env?.PAYPAL_CLIENT_ID,
    hasPayPalClientSecret: !!env?.PAYPAL_CLIENT_SECRET,
    hasDB: !!env?.DB
  });
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResp({ error: 'Not logged in' }, 401);
  }

  let payload;
  try {
    const token = authHeader.split(' ')[1];
    payload = await verifyJwt(token);
  } catch (e) {
    return jsonResp({ error: 'Invalid token' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResp({ error: 'Invalid request format' }, 400);
  }

  const { planId } = body;
  const plan = PLANS[planId];
  
  if (!plan) {
    return jsonResp({ error: 'Invalid plan' }, 400);
  }

  try {
    const accessToken = await getAccessToken(env);
    const customIdValue = `${payload.id}:${planId}`;
    
    // 终身会员使用一次性付款
    if (planId === 'lifetime') {
      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [{
          description: plan.name,
          amount: {
            currency_code: plan.currency,
            value: plan.regularPrice.toFixed(2),
          },
          custom_id: customIdValue,
        }],
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
        return jsonResp({ error: 'Failed to create order' }, 500);
      }

      const order = await response.json();
      
      // 保存到数据库
      try {
        await env.DB.prepare(`
          INSERT INTO subscriptions (user_id, plan_type, amount, currency, status, created_at)
          VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        `).bind(payload.id, planId, plan.regularPrice, plan.currency).run();
      } catch (dbError) {
        console.error('Database error:', dbError);
      }

      return jsonResp({
        orderId: order.id,
        approvalLink: order.links.find(link => link.rel === 'approve')?.href,
        type: 'one-time',
      });
    }
    
    // 月付/年付使用订阅模式
    // 1. 创建产品（如果不存在）
    // 2. 创建计划
    // 3. 创建订阅
    
    // 简化：使用一次性付款但标记为订阅
    // 实际项目中应该使用 PayPal Subscription API
    
    const isFirstMonth = planId === 'monthly' && plan.trialPrice !== null;
    const price = isFirstMonth ? plan.trialPrice : plan.regularPrice;
    
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        description: `${plan.name}${isFirstMonth ? ' (First Month Trial)' : ''}`,
        amount: {
          currency_code: plan.currency,
          value: price.toFixed(2),
        },
        custom_id: customIdValue,
      }],
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
      return jsonResp({ error: 'Failed to create order' }, 500);
    }

    const order = await response.json();
    
    // 保存到数据库
    try {
      await env.DB.prepare(`
        INSERT INTO subscriptions (user_id, plan_type, amount, currency, status, is_trial, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
      `).bind(payload.id, planId, price, plan.currency, isFirstMonth ? 1 : 0).run();
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return jsonResp({
      orderId: order.id,
      approvalLink: order.links.find(link => link.rel === 'approve')?.href,
      type: isFirstMonth ? 'trial' : 'subscription',
      regularPrice: plan.regularPrice,
    });

  } catch (error) {
    console.error('PayPal error:', error);
    return jsonResp({ error: 'Payment service unavailable', details: String(error) }, 500);
  }
}