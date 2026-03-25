const token = localStorage.getItem('token');
const username = localStorage.getItem('username');

// 更新欢迎信息
if (username) {
  document.getElementById('welcomeUser').textContent = `👋 ${username}`;
  document.getElementById('logoutBtn').style.display = 'inline-block';
}

function logout() {
  localStorage.clear();
  location.href = 'index.html';
}

// 订阅处理
function subscribe(plan) {
  const plans = {
    monthly: { name: 'Pro 月度', price: 9.9 },
    yearly: { name: 'Pro 年度', price: 99 },
    lifetime: { name: '终身会员', price: 299 }
  };

  alert(`🎁 感谢选择 ${plans[plan].name}！\n\n这是演示版本，实际支付功能需要接入支付系统。\n\n当前价格：¥${plans[plan].price}`);

  // 演示：临时标记为 Pro 用户
  localStorage.setItem('isPro', 'true');
  localStorage.setItem('proExpires', Date.now() + 365 * 24 * 60 * 60 * 1000);

  setTimeout(() => {
    location.href = 'dashboard.html';
  }, 1000);
}

// FAQ 折叠展开
function toggleFaq(header) {
  const item = header.parentElement;
  item.classList.toggle('open');
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 如果是 Pro 用户，高亮显示
  const isPro = localStorage.getItem('isPro') === 'true';
  if (isPro) {
    document.querySelectorAll('.pricing-card').forEach(card => {
      card.style.opacity = '0.6';
    });
    // 添加当前方案标记
    const proCards = document.querySelectorAll('.pricing-card.pro, .pricing-card.pro-year, .pricing-card.lifetime');
    proCards.forEach(card => {
      card.style.opacity = '1';
      const badge = document.createElement('div');
      badge.className = 'current-plan';
      badge.textContent = '✓ 当前方案';
      card.querySelector('.card-header').appendChild(badge);
    });
  }
});
