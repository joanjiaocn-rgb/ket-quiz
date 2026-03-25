// PayPal 支付集成
const API_BASE = location.origin + '/api';

// 加载 PayPal SDK
export async function loadPayPalSDK(clientId) {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&locale=zh_CN`;
    script.onload = () => resolve(window.paypal);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 创建 PayPal 订单
export async function createPayPalOrder(planId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/paypal/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ planId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '创建订单失败');
  }

  const data = await response.json();
  return data.orderId;
}

// 捕获 PayPal 订单
export async function capturePayPalOrder(orderId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/paypal/capture-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '支付确认失败');
  }

  return await response.json();
}

// 渲染 PayPal 支付按钮
export async function renderPayPalButtons(containerId, planId, onSuccess, onError) {
  try {
    // 先获取 PayPal Client ID（从后端获取更安全）
    const paypal = await loadPayPalSDK('Af7Scqb91NwnT2cofnPndwHYjqkImKSJGJGITLt8qlvxLdcvDw6tDctfk7xT1VH8jeKBAi1OjJeT411R');

    paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical',
        label: 'paypal',
      },

      createOrder: async (data, actions) => {
        try {
          const orderId = await createPayPalOrder(planId);
          return orderId;
        } catch (error) {
          console.error('Create order error:', error);
          if (onError) onError(error);
          throw error;
        }
      },

      onApprove: async (data, actions) => {
        try {
          const result = await capturePayPalOrder(data.orderID);
          if (onSuccess) onSuccess(result);
          return result;
        } catch (error) {
          console.error('Capture order error:', error);
          if (onError) onError(error);
          throw error;
        }
      },

      onError: (error) => {
        console.error('PayPal error:', error);
        if (onError) onError(error);
      },

      onCancel: (data) => {
        console.log('Payment cancelled:', data);
      },
    }).render(`#${containerId}`);

  } catch (error) {
    console.error('Failed to render PayPal buttons:', error);
    if (onError) onError(error);
  }
}

// 检查用户订阅状态
export async function checkSubscriptionStatus() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      isPro: data.user?.is_pro === 1,
      subscriptionType: data.user?.subscription_type,
      subscriptionStatus: data.user?.subscription_status,
      proExpiresAt: data.user?.pro_expires_at,
    };
  } catch (error) {
    console.error('Check subscription error:', error);
    return null;
  }
}
