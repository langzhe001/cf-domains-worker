import { Env } from './types';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/apply" && request.method === "POST") {
      const body = await request.json<any>();
      const user = body.user;
      const subdomain = body.subdomain;

      if (!user || !subdomain) {
        return new Response(JSON.stringify({ error: "缺少参数" }), { status: 400 });
      }

      // 读取 KV / Durable Object（简化为模拟存储）
      const key = `user:${user}:domains`;
      let currentCount = Number(await env.DOMAIN_KV.get(key)) || 0;

      if (currentCount >= Number(env.MAX_DOMAINS_PER_USER)) {
        return new Response(JSON.stringify({ error: "已达到分配上限" }), { status: 403 });
      }

      // 调用 Cloudflare API 添加 DNS 记录
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/dns_records`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.CF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "CNAME",
          name: subdomain,
          content: "example.com",
          ttl: 120,
          proxied: true
        })
      });

      const result = await response.json<any>();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Cloudflare API 错误", details: result }), { status: 500 });
      }

      // 更新计数
      await env.DOMAIN_KV.put(key, String(currentCount + 1));

      // 日志写入 Cloudflare Analytics Event
      ctx.waitUntil(fetch("https://api.cloudflare.com/client/v4/accounts/" + env.CF_ACCOUNT_ID + "/event_logs", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.CF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event: "domain_assigned",
          user,
          subdomain,
          timestamp: new Date().toISOString()
        })
      }));

      return new Response(JSON.stringify({ success: true, subdomain }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
};
