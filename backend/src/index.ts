import {Request as IttyRequest} from 'itty-router'
import {ThrowableRouter} from "itty-router-extras";
import {CloudflareEnv} from "./cloudflare_env";
import {UserErrorMessage} from "./types";

const appRouter = ThrowableRouter<Request>()

appRouter.get(
    '/health',
    (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
        console.log("Health check")
        return new Response("Healthy", {status: 200})
    },
)

appRouter.post('/session/:id', async (request: Request, env: CloudflareEnv) => {
    const id = <string>(request as IttyRequest).params!.id
    const isSessionCreated = await env.SESSIONS.get(id)
    if (isSessionCreated == null) {
        const statusCode = 400
        const body: UserErrorMessage = {
            statusCode: 400,
            message: `Session with ID ${id} already exists.`
        }
        return new Response(JSON.stringify(body), {status: statusCode})
    }
    await env.SESSIONS.put(id, "true")
    // Create durable object for session by forwarding request to session.
    return forwardRequestToSession(request, env)
})

appRouter.get('/sessions', async (request: Request, env: CloudflareEnv) => {
        const result = await env.SESSIONS.list();
        const keys: KVNamespaceListKey<unknown>[] = result.keys
        const sessionIds = keys.map((key: KVNamespaceListKey<unknown>) => key.name)
        return new Response(JSON.stringify(sessionIds), {status: 200})
    }
)

appRouter.get('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
    return forwardRequestToSession(request, env)
    }
)

appRouter.post('/sessions/:id/question', async (request: Request, env: CloudflareEnv) => {
        return forwardRequestToSession(request, env);
    }
)

appRouter.post('/sessions/:id/answer', async (request: Request, env: CloudflareEnv) => {
        return forwardRequestToSession(request, env);
    }
)

// for debugging/resetting state
appRouter.delete('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
    const id = <string>(request as IttyRequest).params!.id
    // Delete from KV
    await env.SESSIONS.delete(id)
    // TODO will the below throw when the session doesn't exist?
    const stub = env.SESSION.get(env.SESSION.idFromString(id))
    return stub.fetch(request)
    }
)

appRouter.post('/session/:id/websocket', async (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
    const id = <string>(request as IttyRequest).params!.id
    if (request.headers.get("Upgrade") != "websocket") {
        return new Response("Expected websocket, but not `Upgrade: websocket` header found.", {status: 400});
    }
    const stub = env.SESSION.get(env.SESSION.idFromString(id))
    return stub.fetch(request)
})

function forwardRequestToSession(request: Request, env: CloudflareEnv) {
    const id = <string>(request as IttyRequest).params!.id
    return env.SESSION.get(env.SESSION.idFromString(id)).fetch(request)
}

export {SessionDurableObject} from './session_durable_object';