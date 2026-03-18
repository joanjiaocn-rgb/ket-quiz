# KET冲刺小站 🦄

KET考前冲刺测试平台，基于 Cloudflare Pages + Workers + D1。

## 部署步骤

### 1. 创建 D1 数据库
```bash
npx wrangler d1 create ket-quiz-db
```
复制输出的 `database_id`，填入 `wrangler.toml`。

### 2. 初始化数据库
```bash
npx wrangler d1 execute ket-quiz-db --file=schema.sql
```

### 3. 推送到 GitHub
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/你的用户名/ket-quiz.git
git push -u origin main
```

### 4. Cloudflare Pages 连接 GitHub
1. Cloudflare Dashboard → Pages → Create project → Connect to Git
2. Build output directory: `frontend`，Build command 留空
3. Settings → Functions → D1 bindings：变量名 `DB`，选 `ket-quiz-db`

### 5. GitHub Secrets（自动部署）
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
