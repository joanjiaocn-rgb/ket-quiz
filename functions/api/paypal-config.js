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
    regularPrice: 4.99,      // 正常价格
    trialPrice: 0.10,        // 首月优惠价格
    currency: 'USD',
    interval: 'MONTH',
    cnyPrice: 9.9,
  },
  yearly: {
    id: 'yearly',
    name: 'Pro Yearly',
    regularPrice: 49.99,
    trialPrice: null,        // 年付没有首月优惠
    currency: 'USD',
    interval: 'YEAR',
    cnyPrice: 99,
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    regularPrice: 149.99,
    trialPrice: null,
    currency: 'USD',
    interval: null,
    cnyPrice: 299,
  },
};

// 获取 PayPal API access token
export async function getAccessToken(env) {
  // 优先使用环境变量，回退到硬编码配置
  const clientId = env?.PAYPAL_CLIENT_ID || PAYPAL_CONFIG.clientId;
  const clientSecret = env?.PAYPAL_CLIENT_SECRET || PAYPAL_CONFIG.clientSecret;
  
  console.log('PayPal getAccessToken - env check:', {
    hasEnv: !!env,
    envKeys: env ? Object.keys(env) : [],
    hasClientId: !!env?.PAYPAL_CLIENT_ID,
    hasClientSecret: !!env?.PAYPAL_CLIENT_SECRET,
    clientIdLength: env?.PAYPAL_CLIENT_ID?.length || 0,
    clientSecretLength: env?.PAYPAL_CLIENT_SECRET?.length || 0,
    usingEnv: !!env?.PAYPAL_CLIENT_ID && !!env?.PAYPAL_CLIENT_SECRET,
    fallbackClientId: PAYPAL_CONFIG.clientId.substring(0, 10) + '...'
  });
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }
  
  // 使用 btoa 进行 Base64 编码（Cloudflare Workers 兼容）
  const auth = btoa(`${clientId}:${clientSecret}`);
  
  console.log('PayPal token request:', {
    url: `${PAYPAL_CONFIG.apiBase}/v1/oauth2/token`,
    authHeader: 'Basic ' + auth.substring(0, 20) + '...'
  });
  
  const response = await fetch(`${PAYPAL_CONFIG.apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal token error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Failed to get PayPal access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('PayPal token success:', { tokenType: data.token_type, expiresIn: data.expires_in });
  return data.access_token;
}

// 验证 Webhook 签名（简化版）
export async function verifyWebhookSignature(request, env) {
  // 生产环境应该验证 PayPal Webhook 签名
  // 这里简化处理，仅记录事件
  return true;
}
