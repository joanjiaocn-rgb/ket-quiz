// 定价页面逻辑
import { renderPayPalButtons, checkSubscriptionStatus } from './paypal.js';

const API_BASE = location.origin + '/api';
let token = localStorage.getItem('token');

// 检查登录状态
if (!token) {
  location.href = 'index.html';
}

// 初始化页面
async function init() {
  const username = localStorage.getItem('username') || '';
  document.getElementById('welcomeUser').textContent = `👤 ${username}`;

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
  // 更新页面显示当前订阅状态
  const cards = document.querySelectorAll('.pricing-card');
  cards.forEach(card => {
    card.classList.remove('current-plan');
  });

  // 标记当前方案
  if (status.subscriptionType) {
    const currentCard = document.querySelector(`.pricing-card.${status.subscriptionType}`);
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

// 订阅函数
async function subscribe(planId) {
  console.log('选择订阅方案:', planId);

  // 隐藏所有支付按钮容器
  document.querySelectorAll('.paypal-buttons-container').forEach(el => {
    el.innerHTML = '';
    el.style.display = 'none';
  });

  // 显示对应方案的支付按钮
  const containerId = `paypal-buttons-${planId}`;
  const container = document.getElementById(containerId);
  
  if (!container) {
    // 如果容器不存在，创建一个
    createPayPalContainer(planId);
  }

  // 渲染 PayPal 按钮
  try {
    await renderPayPalButtons(
      `paypal-buttons-${planId}`,
      planId,
      onPaymentSuccess,
      onPaymentError
    );
  } catch (error) {
    console.error('渲染支付按钮失败:', error);
    alert('支付按钮加载失败，请刷新页面试试');
  }
}

// 创建 PayPal 按钮容器
function createPayPalContainer(planId) {
  const card = document.querySelector(`.pricing-card.${planId === 'monthly' ? 'pro' : planId === 'yearly' ? 'pro-year' : 'lifetime'}`);
  if (!card) return;

  const container = document.createElement('div');
  container.id = `paypal-buttons-${planId}`;
  container.className = 'paypal-buttons-container';
  container.style.marginTop = '16px';
  
  const btn = card.querySelector('button');
  if (btn) {
    btn.style.display = 'none';
  }
  
  card.appendChild(container);
}

// 支付成功回调
function onPaymentSuccess(result) {
  console.log('支付成功:', result);
  
  // 显示成功消息
  alert(`支付成功！🎉\n\n你已成功升级到 ${getPlanName(result.plan)} 会员！`);
  
  // 刷新页面以更新状态
  setTimeout(() => {
    location.reload();
  }, 1000);
}

// 支付失败回调
function onPaymentError(error) {
  console.error('支付失败:', error);
  alert('支付失败，请重试或联系客服');
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
document.addEventListener('DOMContentLoaded', init);
