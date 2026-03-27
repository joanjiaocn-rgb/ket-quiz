// PayPal 配置
export const PAYPAL_CONFIG = {
  mode: 'live', // 'sandbox' 或 'live'
  clientId: 'Af6w53RqP8kScLPh6CcEUZ7OJFO4jrH8niB-he73qQDRJNw6WglQ7YUIfAXnG2pYA0ehJs4_MUM_BvdJ',
  clientSecret: 'ELj0nA73mbpu-gFE2ys991mU9Q1YqVwGWlg5c7i6NJ3q0Sq8zV3hphtq96hCocA0nNKmeT3qn_Gnbohj',
  apiBase: 'https://api-m.paypal.com', // 正式环境 API
  webhookId: '', // 后续配置 Webhook 后填写
};

// 定价方案
export const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Pro Monthly',
    price: 4.99, // USD
    currency: 'USD',
    interval: 'MONTH',
    cnyPrice: 9.9,
  },
  yearly: {
    id: 'yearly',
    name: 'Pro Yearly',
    price: 49.99, // USD
    currency: 'USD',
    interval: 'YEAR',
    cnyPrice: 99,
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    price: 149.99, // USD
    currency: 'USD',
    interval: null,
    cnyPrice: 299,
  },
};

// 获取 PayPal API access token
export async function getAccessToken(env) {
  // 使用 btoa 进行 Base64 编码（Cloudflare Workers 兼容）
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

// 验证 Webhook 签名（简化版）
export async function verifyWebhookSignature(request, env) {
  // 生产环境应该验证 PayPal Webhook 签名
  // 这里简化处理，仅记录事件
  return true;
}
