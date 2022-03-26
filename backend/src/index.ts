import {Request as IttyRequest} from 'itty-router'
import {missing, ThrowableRouter} from "itty-router-extras";
import {CloudflareEnv} from "./cloudflare_env";
import {UserErrorMessage} from "./types";

const appRouter = ThrowableRouter<Request>()

appRouter.get(
    '/health',
    (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
        console.log("Health check")
        return new Response(null, {status: 200})
    },
)

appRouter.get('/sessions', async (request: Request, env: CloudflareEnv) => {
        const result = await env.SESSIONS.list();
        const keys: KVNamespaceListKey<unknown>[] = result.keys
        const sessionIds = keys.map((key: KVNamespaceListKey<unknown>) => key.name)
        return new Response(JSON.stringify(sessionIds), {status: 200})
    }
)

appRouter.post('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
    const id = <string>(request as IttyRequest).params!.id
    // const isSessionCreated = await env.SESSIONS.get(id)
    // We let users overwrite their session as if it didn't exist, because Cloudflare workers.
    // if (isSessionCreated === "true") {
    //     const statusCode = 400
    //     const body: UserErrorMessage = {
    //         statusCode: 400,
    //         message: `Session with ID ${id} already exists.`
    //     }
    //     return new Response(JSON.stringify(body), {status: statusCode})
    // }
    await env.SESSIONS.put(id, "true")
    // Create durable object for session by forwarding request to session.
    return await forwardRequestToSession(request, env)
})

appRouter.get('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
        return await forwardRequestToSession(request, env)
    }
)

appRouter.post('/sessions/:id/question', async (request: Request, env: CloudflareEnv) => {
        return await forwardRequestToSession(request, env);
    }
)

appRouter.post('/sessions/:id/answer', async (request: Request, env: CloudflareEnv) => {
        return await forwardRequestToSession(request, env);
    }
)

// for debugging/resetting state
appRouter.delete('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
        const id = <string>(request as IttyRequest).params!.id
        return await deleteSession(env, request, id)
    }
)

const deleteSession = async (env: CloudflareEnv, request: Request, sessionId: string) => {
    console.log(`Deleting ${sessionId} from KV`)
    await env.SESSIONS.delete(sessionId)
    console.log(`Deleting ${sessionId} internal state`)
    return await forwardRequestToSession(request, env)
}

// DISABLED because Cloudflare KV is seriously delayed - not just eventually consistent.
// appRouter.delete('/sessions', async (request: Request, env: CloudflareEnv) => {
//         const keysResult = await env.SESSIONS.list();
//         const keys: KVNamespaceListKey<unknown>[] = keysResult.keys
//         if (!keysResult.list_complete) {
//             const error = {
//                 message: "We don't support pagination yet, but we have too many sessions, than the page-size. You need to delete them individually."
//             }
//             return new Response(JSON.stringify(error), {status: 500})
//         }
//         console.log(JSON.stringify(keys.keys()))
//         for (const key of keys) {
//             try {
//                 await deleteSession(env, request, key.name)
//             } catch (e) {
//                 // Skip this, because Cloudflare KV is eventually consistent, and the Session ID stored in KV
//                 // doesn't exist anymore and has already been deleted. KV will be eventually be consistent.
//             }
//         }
//         return new Response(null, {status: 200})
//     }
// )


appRouter.get('/sessions/:id/websocket', async (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
    if (request.headers.get("Upgrade") != "websocket") {
        return new Response("Expected websocket, but not `Upgrade: websocket` header found.", {status: 400});
    }
    return await forwardRequestToSession(request, env)
})

appRouter.all('*', (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
    console.log("Scope: Cloudflare Worker index.ts")
    console.log(`Request: ${JSON.stringify(request)}`)
    console.log(request.url)
    // console.log(JSON.stringify(env))
    // console.log(JSON.stringify(context))
    return missing("That URL doesn't exist.")
})

appRouter.delete('/sessions/:id/websocket', async (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
    return await forwardRequestToSession(request, env)
})

async function forwardRequestToSession(request: Request, env: CloudflareEnv): Promise<Response> {
    const id = <string>(request as IttyRequest).params!.id
    console.info(`forwardRequestToSession: ${id}`)
    // Using idFromName, not idFromString, because a string ID is the DurableObjectID, not the Session ID.
    return await env.SESSION.get(env.SESSION.idFromName(id)).fetch(request)
}

export default {
    async fetch(request: Request, ...args: [unknown]): Promise<unknown> {
        return await appRouter.handle(request, ...args)
    },
}

export {SessionDurableObject} from './session_durable_object';