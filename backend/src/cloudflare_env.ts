// Binding to Cloudflare features (e.g. workers durable objects, KV) declared in wrangler.toml
export interface CloudflareEnv {
    SESSION: DurableObjectNamespace,
    SESSIONS: KVNamespace
}