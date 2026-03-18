const API = '';
const token = localStorage.getItem('token');
if (!token) location.href = 'index.html';

const typeMap = {
  vocabulary: '单词', grammar: '语法', reading: '阅读',
  writing: '写作', listening: '听力', speaking: '口语'
};

async function loadWrong() {
  try {
    const res = await fetch(`${API}/api/progress/wrong`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const list = document.getElementById('wrongList');
    if (!data.length) {
      list.classList.add('hidden');
      document.getElementById('emptyMsg').classList.remove('hidden');
      return;
    }
    list.innerHTML = data.map(q => `
      <div class="wrong-card">
        <span class="wc-type">${typeMap[q.type] || q.type}</span>
        <div class="wc-question">${q.question}</div>
        <div class="wc-answers">
          <span class="wc-my">❌ 我的答案：${q.user_answer || '未作答'}</span>
          <span class="wc-correct">✅ 正确答案：${q.answer}</span>
        </div>
        ${q.explanation ? `<div class="wc-exp">💡 ${q.explanation}</div>` : ''}
      </div>`).join('');
  } catch {
    document.getElementById('wrongList').innerHTML = '<p style="text-align:center;color:#F87171;padding:20px">加载失败</p>';
  }
}

loadWrong();
