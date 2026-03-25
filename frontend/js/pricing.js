// 定价页面逻辑 - 不使用 ES6 import
const API_BASE = location.origin + '/api';
let token = localStorage.getItem('token');

// PayPal SDK 加载
async function loadPayPalSDK() {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=Af7Scqb91NwnT2cofnPndwHYjqkImKSJGJGITLt8qlvxLdcvDw6tDctfk7xT1VH8jeKBAi1OjJeT411R&currency=USD&locale=zh_CN';
    script.onload = () => resolve(window.paypal);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 创建 PayPal 订单
async function createPayPalOrder(planId) {
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
async function capturePayPalOrder(orderId) {
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
async function renderPayPalButtons(containerId, planId) {
  try {
    const paypal = await loadPayPalSDK();

    paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical',
        label: 'paypal',
      },

      createOrder: async (data, actions) => {
        try {
          console.log('Creating order for plan:', planId);
          const orderId = await createPayPalOrder(planId);
          console.log('Order created:', orderId);
          return orderId;
        } catch (error) {
          console.error('Create order error:', error);
          alert('创建订单失败: ' + error.message);
          throw error;
        }
      },

      onApprove: async (data, actions) => {
        try {
          console.log('Capturing order:', data.orderID);
          const result = await capturePayPalOrder(data.orderID);
          console.log('Payment success:', result);
          onPaymentSuccess(result);
          return result;
        } catch (error) {
          console.error('Capture order error:', error);
          alert('支付确认失败: ' + error.message);
          throw error;
        }
      },

      onError: (error) => {
        console.error('PayPal error:', error);
        alert('支付出错，请重试');
      },

      onCancel: (data) => {
        console.log('Payment cancelled:', data);
      },
    }).render(`#${containerId}`);

  } catch (error) {
    console.error('Failed to render PayPal buttons:', error);
    alert('支付按钮加载失败，请刷新页面试试');
  }
}

// 检查用户订阅状态
async function checkSubscriptionStatus() {
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

// 获取方案名称
function getPlanName(planId) {
  const names = {
    monthly: 'Pro 月度',
    yearly: 'Pro 年度',
    lifetime: '终身',
  };
  return names[planId] || planId;
}

// 支付成功回调
function onPaymentSuccess(result) {
  console.log('支付成功:', result);
  
  alert(`支付成功！🎉\n\n你已成功升级到 ${getPlanName(result.plan)} 会员！`);
  
  setTimeout(() => {
    location.reload();
  }, 1000);
}

// 初始化页面
async function init() {
  console.log('Initializing pricing page...');
  
  const username = localStorage.getItem('username') || '';
  const welcomeUser = document.getElementById('welcomeUser');
  if (welcomeUser) {
    welcomeUser.textContent = `👤 ${username}`;
  }

  // 检查登录状态
  if (!token) {
    location.href = 'index.html';
    return;
  }

  // 检查用户订阅状态
  const status = await checkSubscriptionStatus();
  if (status?.isPro) {
    showSubscriptionStatus(status);
  }

  // 初始化 FAQ 折叠
  initFaq();
}

// 显示订阅状态
function showSubscriptionStatus(status) {
  console.log('Current subscription:', status);
  
  // 更新页面显示当前订阅状态
  const cards = document.querySelectorAll('.pricing-card');
  cards.forEach(card => {
    card.classList.remove('current-plan');
  });

  // 标记当前方案
  if (status.subscriptionType) {
    let selector = '';
    if (status.subscriptionType === 'monthly') selector = '.pro';
    else if (status.subscriptionType === 'yearly') selector = '.pro-year';
    else if (status.subscriptionType === 'lifetime') selector = '.lifetime';
    
    if (selector) {
      const currentCard = document.querySelector(`.pricing-card${selector}`);
      if (currentCard) {
        currentCard.classList.add('current-plan');
        const btn = currentCard.querySelector('button');
        if (btn) {
          btn.textContent = '当前方案';
          btn.disabled = true;
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-secondary');
        }
      }
    }
  }
}

// 订阅函数
async function subscribe(planId) {
  console.log('选择订阅方案:', planId);

  // 隐藏所有支付按钮容器
  document.querySelectorAll('.paypal-buttons-container').forEach(el => {
    el.innerHTML = '';
    el.style.display = 'none';
  });

  // 创建容器 ID
  const containerId = `paypal-buttons-${planId}`;
  
  // 检查容器是否存在
  let container = document.getElementById(containerId);
  
  if (!container) {
    // 如果容器不存在，创建一个
    let cardSelector = '';
    if (planId === 'monthly') cardSelector = '.pro';
    else if (planId === 'yearly') cardSelector = '.pro-year';
    else if (planId === 'lifetime') cardSelector = '.lifetime';
    
    const card = document.querySelector(`.pricing-card${cardSelector}`);
    if (!card) {
      console.error('Card not found for plan:', planId);
      return;
    }

    container = document.createElement('div');
    container.id = containerId;
    container.className = 'paypal-buttons-container';
    container.style.marginTop = '16px';
    
    const btn = card.querySelector('button');
    if (btn) {
      btn.style.display = 'none';
    }
    
    card.appendChild(container);
  } else {
    container.style.display = 'block';
  }

  // 渲染 PayPal 按钮
  console.log('Rendering PayPal buttons in:', containerId);
  await renderPayPalButtons(containerId, planId);
}

// FAQ 折叠功能
function initFaq() {
  document.querySelectorAll('.faq-item h3').forEach(h3 => {
    h3.addEventListener('click', () => {
      const answer = h3.nextElementSibling;
      answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
    });
  });
}

// 切换 FAQ
function toggleFaq(element) {
  const answer = element.nextElementSibling;
  answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
}

// 退出登录
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  location.href = 'index.html';
}

// 暴露全局函数
window.subscribe = subscribe;
window.toggleFaq = toggleFaq;
window.logout = logout;

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
