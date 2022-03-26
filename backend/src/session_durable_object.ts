import {
    CreateAnswerRequestBody,
    CreateAnswerRequestBodySchema,
    CreateQuestionRequestBody,
    CreateQuestionRequestBodySchema,
    CreateSessionRequestBody,
    createSessionRequestBodySchema,
    validateWith
} from "./schema";
import {CloudflareEnv} from "./cloudflare_env";
import {WebsocketSessionManager} from "./realtime/websocket_session_manager";
import {Request as IttyRequest} from "itty-router";
import {Session, SyncEvent} from "./types";
import {SessionState} from "./session_state";
import {missing, ThrowableRouter} from "itty-router-extras";

export class SessionDurableObject {
    private state: SessionState;
    private env: CloudflareEnv;
    private websocketSessionManager: WebsocketSessionManager

    constructor(durableObjectState: DurableObjectState, env: CloudflareEnv) {
        this.state = new SessionState(durableObjectState,
            (event: SyncEvent) => this.websocketSessionManager.update(event))
        this.env = env
        this.websocketSessionManager = new WebsocketSessionManager()
    }

    async fetch(request: Request, env: CloudflareEnv, context: ExecutionContext): Promise<Response> {
        console.log("Received request on session durable object.")
        const sessionRouter = ThrowableRouter<Request>()

        sessionRouter.post('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
                const id = <string>(request as IttyRequest).params!.id
                const json: CreateSessionRequestBody = await request.json!()
                const errors = validateWith(createSessionRequestBodySchema, json)
                if (errors.length > 0) {
                    return new Response(JSON.stringify(errors), {status: 400})
                }
                await this.state.createSession(id, json)
                return new Response(null, {status: 200})
            }
        )

        sessionRouter.get('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
                // TODO session endpoint: get session state: all questions and answers. Call this sparingly.
                // this also provides the time you request it. A guarantee that if you persist this data
                // you only need to request data from this time. This helps offline use.
                const session: Session = await this.state.getSnapshot()
                return new Response(JSON.stringify(session), {status: 200})
            }
        )

        sessionRouter.post('/sessions/:id/question', async (request: Request, env: CloudflareEnv) => {
                const json: CreateQuestionRequestBody = await request.json!()
                const errors = validateWith(CreateQuestionRequestBodySchema, json)
                if (errors.length > 0) {
                    return new Response(JSON.stringify(errors), {status: 400})
                }
                await this.state.createQuestion(json)
                return new Response(null, {status: 200})
            }
        )

        sessionRouter.post('/sessions/:id/answer', async (request: Request, env: CloudflareEnv) => {
                const json: CreateAnswerRequestBody = await request.json!()
                const errors = validateWith(CreateAnswerRequestBodySchema, json)
                if (errors.length > 0) {
                    return new Response(JSON.stringify(errors), {status: 400})
                }
                await this.state.createAnswer(json)
                return new Response(null, {status: 200})
            }
        )

        sessionRouter.delete('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
                await this.state.deleteSession();
                return new Response(null, {status: 200});
            }
        )

        // TO handle the "delete all" sessions endpoint
        sessionRouter.delete('/sessions', async (request: Request, env: CloudflareEnv) => {
                await this.state.deleteSession();
                return new Response(null, {status: 200});
            }
        )

        sessionRouter.get('/sessions/:id/websocket', async (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
            const clientIp = <string>request.headers.get("CF-Connecting-IP");
            console.log(`Setting up websocket for ${clientIp}`)
            const clientWebsocket = this.websocketSessionManager.create(clientIp)
            return new Response(null, {status: 101, webSocket: clientWebsocket})
        })

        sessionRouter.delete('/sessions/:id/websocket', async (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
            const clientIp = <string>request.headers.get("CF-Connecting-IP")!;
            this.websocketSessionManager.close(clientIp)
            return new Response(null, {status: 200})
        })

        sessionRouter.all('*', (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
            console.log("Scope: Session durable object")
            console.log(`Request: ${JSON.stringify(request)}`)
            console.log(request.url)
            return missing("That URL doesn't exist.")
        })

        return await sessionRouter.handle(request, env, context)
    }
}
