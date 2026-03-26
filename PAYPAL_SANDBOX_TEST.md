# PayPal Sandbox 测试指南

## 1. 获取 Sandbox 账号

1. 访问 https://developer.paypal.com/
2. 登录你的 PayPal 开发者账号
3. 进入 "Dashboard" → "Testing Tools" → "Sandbox Accounts"
4. 你会看到两个默认账号：
   - **Business**（商家账号）- 接收付款
   - **Personal**（买家账号）- 用于测试付款

## 2. 配置 Sandbox Webhook（推荐）

1. 在 PayPal Developer 控制台，进入 "Apps & Credentials"
2. 选择你的 Sandbox 应用
3. 滚动到 "Webhooks" 部分
4. 点击 "Add Webhook"
5. 填写：
   - Webhook URL: `https://ket-quiz.pages.dev/api/paypal/webhook`
   - 选择以下事件类型：
     - ✅ `CHECKOUT.ORDER.COMPLETED`
     - ✅ `PAYMENT.CAPTURE.COMPLETED`
     - ✅ `PAYMENT.CAPTURE.REFUNDED`
     - ✅ `BILLING.SUBSCRIPTION.CANCELLED`
     - ✅ `BILLING.SUBSCRIPTION.EXPIRED`
6. 点击 "Save"
7. 复制生成的 Webhook ID，更新到 `functions/api/paypal/config.js`

## 3. 测试支付流程

### 测试步骤

1. **访问定价页面**
   - 打开 https://ket-quiz.pages.dev/pricing.html
   - 确保已登录账号

2. **选择方案并点击支付**
   - 点击"Pro 月度"的"立即升级"按钮
   - 等待 PayPal 按钮加载

3. **使用 Sandbox 买家账号支付**
   - 点击 PayPal 按钮
   - 使用 Sandbox Personal 账号登录
     - 邮箱：在 PayPal Developer 控制台查看
     - 密码：在 PayPal Developer 控制台查看
   - 确认支付

4. **验证结果**
   - 支付成功后应该看到成功提示
   - 页面会自动刷新
   - 检查用户状态是否变为 Pro
   - 检查数据库中的订阅记录

## 4. 检查数据库（可选）

使用 wrangler 查看数据库：

```bash
# 查看用户表
npx wrangler d1 execute ket-quiz-db --remote --command "SELECT id, username, is_pro, subscription_type FROM users"

# 查看订阅记录
npx wrangler d1 execute ket-quiz-db --remote --command "SELECT * FROM subscriptions ORDER BY id DESC LIMIT 5"

# 查看 Webhook 事件
npx wrangler d1 execute ket-quiz-db --remote --command "SELECT * FROM paypal_webhooks ORDER BY id DESC LIMIT 5"
```

## 5. 测试完成后切换到 Live

1. 更新 `functions/api/paypal/config.js`：
   ```javascript
   mode: 'live',
   clientId: '你的 Live Client ID',
   clientSecret: '你的 Live Client Secret',
   apiBase: 'https://api-m.paypal.com',
   ```

2. 使用真实的 PayPal 账号测试（建议先用小额测试）

3. 配置 Live 环境的 Webhook（与 Sandbox 步骤相同）
