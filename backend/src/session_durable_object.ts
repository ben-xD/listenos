import {CloudflareEnv} from "./cloudflare_env";
import {Request as IttyRequest, Router} from "itty-router";
import {WebsocketSessionManager} from "./realtime/websocket_session_manager";
import {Session, SyncEvent} from "./types";
import {SessionState} from "./session_state";
import {
    CreateAnswerRequestBody,
    CreateAnswerRequestBodySchema,
    CreateQuestionRequestBody,
    CreateQuestionRequestBodySchema,
    CreateSessionRequestBody,
    createSessionRequestBodySchema,
    validateWith
} from "./request_validators";

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

    async fetch(request: Request) {
        const router = Router<Request>()

        router.post('/session/:id', async (request: Request, env: CloudflareEnv) => {
                const json: CreateSessionRequestBody = await request.json!()
                const id = <string>(request as IttyRequest).params!.id
                const errors = validateWith(createSessionRequestBodySchema, json)
                if (errors) {
                    return new Response(JSON.stringify(errors), {status: 400})
                }
                await this.state.createSession(id, json)
                return new Response(null, {status: 200})
            }
        )

        router.get('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
                // TODO session endpoint: get session state: all questions and answers. Call this sparingly.
                // this also provides the time you request it. A guarantee that if you persist this data
                // you only need to request data from this time. This helps offline use.
                const session: Session = await this.state.getSnapshot()
                return new Response(JSON.stringify(session), {status: 200})
            }
        )

        router.post('/sessions/:id/question', async (request: Request, env: CloudflareEnv) => {
                const json: CreateQuestionRequestBody = await request.json!()
                const errors = validateWith(CreateQuestionRequestBodySchema, json)
                if (errors) {
                    return new Response(JSON.stringify(errors), {status: 400})
                }
                await this.state.createQuestion(json)
                return new Response(null, {status: 200})
            }
        )

        router.post('/sessions/:id/answer', async (request: Request, env: CloudflareEnv) => {
                const json: CreateAnswerRequestBody = await request.json!()
                const errors = validateWith(CreateAnswerRequestBodySchema, json)
                if (errors) {
                    return new Response(JSON.stringify(errors), {status: 400})
                }
                await this.state.createAnswer(json)
                return new Response(null, {status: 200})
            }
        )

        router.delete('/sessions/:id', async (request: Request, env: CloudflareEnv) => {
                await this.state.deleteSession();
                return new Response(null, {status: 200});
            }
        )

        router.post('/session/:id/websocket', async (request: Request, env: CloudflareEnv, context: ExecutionContext) => {
            const clientIp = <string>request.headers.get("CF-Connecting-IP");
            const clientWebsocket = this.websocketSessionManager.create(clientIp)
            return new Response(null, {status: 101, webSocket: clientWebsocket})
        })


        return router.handle(request)
    }
}
