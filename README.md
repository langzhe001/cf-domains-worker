# Cloudflare Worker - 域名分发系统

## 📌 功能
- 用户可自助申请二级域名
- 自动调用 Cloudflare API 配置 DNS
- 普通用户可分配域名数限制 (默认 3 个)
- 日志事件写入 Cloudflare Analytics

## ⚙️ 环境变量 (在 Cloudflare Dashboard -> Workers -> Settings 配置)
- `CF_API_TOKEN` → Cloudflare API Token
- `CF_ACCOUNT_ID` → Cloudflare 账号 ID
- `CF_ZONE_ID` → 主域名 Zone ID
- `MAX_DOMAINS_PER_USER` → 每个用户允许的最大二级域名数 (默认 3)

## 🚀 部署方法
```bash
npm install
npm run deploy
```

## 📖 常见问题
1. **DNS 记录多久生效？**  
   通常在 1 分钟内，取决于 DNS 缓存。

2. **如何扩展用户权限？**  
   可以在 KV / Durable Object 存储中记录用户等级，根据等级动态调整 `MAX_DOMAINS_PER_USER`。

3. **如何查看日志？**  
   日志事件写入 **Cloudflare Analytics**，可在账户面板中查看。
