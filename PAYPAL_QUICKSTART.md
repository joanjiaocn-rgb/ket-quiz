# PayPal 支付快速部署指南

## 已完成的工作

### 1. 数据库迁移
- ✅ 创建了 `migrate_paypal.sql` - 包含所有必要的表结构

### 2. 后端 API (Cloudflare Functions)
- ✅ `functions/api/paypal/config.js` - PayPal 配置
- ✅ `functions/api/paypal/create-order.js` - 创建订单
- ✅ `functions/api/paypal/capture-order.js` - 捕获订单
- ✅ `functions/api/paypal/webhook.js` - Webhook 处理

### 3. 前端集成
- ✅ `frontend/js/paypal.js` - PayPal SDK 封装
- ✅ `frontend/js/pricing.js` - 定价页面集成

## 部署步骤

### 第一步：运行数据库迁移

```bash
cd /root/.openclaw/workspace/ket-quiz
npx wrangler d1 execute ket-quiz-db --file=migrate_paypal.sql --remote
```

### 第二步：部署 Cloudflare Functions

```bash
# 代码已推送到 GitHub，Cloudflare Pages 会自动部署
# 或者手动部署：
CLOUDFLARE_API_TOKEN=cfut_d2kvjws2oUdegpBRS9bUowhWSErEhvaTAXyTxZdGb7c0f2c1 \
npx wrangler pages deploy --project-name ket-quiz --branch main frontend/
```

### 第三步：配置 PayPal Webhook（可选但推荐）

1. 登录 PayPal Developer 控制台
2. 进入你的 Sandbox 应用
3. 添加 Webhook：
   - Webhook URL: `https://ket-quiz.pages.dev/api/paypal/webhook`
   - 选择以下事件：
     - `CHECKOUT.ORDER.COMPLETED`
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.REFUNDED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `BILLING.SUBSCRIPTION.EXPIRED`
4. 获取 Webhook ID 并更新到 `functions/api/paypal/config.js`

## 测试流程

### 1. 使用 Sandbox 账号测试
- PayPal Sandbox 买家账号：可在 PayPal Developer 控制台创建
- 测试金额：会从 Sandbox 账号扣除，不会真的扣费

### 2. 测试支付流程
1. 访问定价页面
2. 选择一个方案
3. 点击 PayPal 支付按钮
4. 使用 Sandbox 买家账号完成支付
5. 验证用户状态是否更新为 Pro

## 定价方案（Sandbox 测试价格）

| 方案 | CNY | USD |
|------|-----|-----|
| 月度会员 | ¥9.9 | $1.99 |
| 年度会员 | ¥99 | $14.99 |
| 终身会员 | ¥299 | $39.99 |

## 文件结构

```
ket-quiz/
├── migrate_paypal.sql                    # 数据库迁移
├── PAYPAL_INTEGRATION.md                 # 详细集成文档
├── PAYPAL_QUICKSTART.md                  # 本文件
├── functions/api/paypal/
│   ├── config.js                         # PayPal 配置
│   ├── create-order.js                   # 创建订单 API
│   ├── capture-order.js                  # 捕获订单 API
│   └── webhook.js                        # Webhook 处理 API
└── frontend/js/
    ├── paypal.js                         # PayPal 前端 SDK
    └── pricing.js                        # 定价页面逻辑
```

## 注意事项

1. **先测试 Sandbox**：完全测试通过后再切换到 Live 环境
2. **Webhook 配置**：生产环境必须配置 Webhook 以确保数据一致性
3. **汇率更新**：USD 价格需要根据实时汇率调整
4. **数据库备份**：运行迁移前先备份数据库

## 故障排除

### 支付按钮不显示
- 检查浏览器控制台是否有错误
- 确认 PayPal Client ID 正确
- 确认网络可以访问 paypal.com

### 支付成功但状态未更新
- 检查数据库迁移是否成功运行
- 查看 Cloudflare Functions 日志
- 确认 Webhook 配置正确（如果使用）

### 想要切换到 Live 环境
1. 更新 `PAYPAL_CONFIG.mode` 为 `'live'`
2. 使用 Live 环境的 Client ID 和 Secret
3. 更新定价为真实价格
