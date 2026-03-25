// PayPal 配置
export const PAYPAL_CONFIG = {
  mode: 'sandbox', // 'sandbox' 或 'live'
  clientId: 'Af7Scqb91NwnT2cofnPndwHYjqkImKSJGJGITLt8qlvxLdcvDw6tDctfk7xT1VH8jeKBAi1OjJeT411R',
  clientSecret: 'EDBwT8xf200f54mN8orpRSWDQmY_HA3qFwPcy75kVUuiKbFTI38O6XvIZP0aTRiCjv8gh4dRR1bcQpLA',
  apiBase: 'https://api-m.sandbox.paypal.com',
  webhookId: '', // 后续配置 Webhook 后填写
};

// 定价方案
export const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Pro 月度',
    price: 1.99, // USD
    currency: 'USD',
    interval: 'MONTH',
    cnyPrice: 9.9,
  },
  yearly: {
    id: 'yearly',
    name: 'Pro 年度',
    price: 14.99, // USD
    currency: 'USD',
    interval: 'YEAR',
    cnyPrice: 99,
  },
  lifetime: {
    id: 'lifetime',
    name: '终身会员',
    price: 39.99, // USD
    currency: 'USD',
    interval: null,
    cnyPrice: 299,
  },
};

// 获取 PayPal API access token
export async function getAccessToken(env) {
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

// 验证 Webhook 签名（简化版）
export async function verifyWebhookSignature(request, env) {
  // 生产环境应该验证 PayPal Webhook 签名
  // 这里简化处理，仅记录事件
  return true;
}
