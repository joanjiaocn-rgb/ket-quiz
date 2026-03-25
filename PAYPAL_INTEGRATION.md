# PayPal 支付集成方案

## 配置信息

- **环境**: Sandbox（测试环境）
- **Client ID**: Af7Scqb91NwnT2cofnPndwHYjqkImKSJGJGITLt8qlvxLdcvDw6tDctfk7xT1VH8jeKBAi1OjJeT411R
- **Client Secret**: EDBwT8xf200f54mN8orpRSWDQmY_HA3qFwPcy75kVUuiKbFTI38O6XvIZP0aTRiCjv8gh4dRR1bcQpLA
- **Webhook**: 需要配置

## 集成步骤

### 1. 数据库迁移
- 添加 subscriptions 表
- 更新 users 表添加订阅相关字段

### 2. 后端 API
- 创建支付订单 API
- 验证支付 API
- Webhook 处理 API
- 订阅状态查询 API

### 3. 前端集成
- PayPal Smart Payment Buttons
- 支付成功/失败页面
- 订阅管理页面

### 4. Webhook 配置
- 支付完成通知
- 订阅取消通知
- 退款通知

## 定价方案（USD）

| 方案 | CNY | USD（估算） | PayPal 方案 ID |
|------|-----|-------------|----------------|
| 月度会员 | ¥9.9 | $1.99 | monthly |
| 年度会员 | ¥99 | $14.99 | yearly |
| 终身会员 | ¥299 | $39.99 | lifetime |

注意：需要根据实时汇率调整 USD 价格。
