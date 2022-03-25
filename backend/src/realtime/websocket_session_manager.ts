import {WebsocketSession} from "./websocket_session";
import {SyncEvent} from "../types";

export class WebsocketSessionManager {
    private websocketSessionsByClientIp: Map<string, WebsocketSession> = new Map();

    create(clientIp: string): WebSocket {
        console.info(`Creating WebSocket session for client with IP: ${clientIp}`)
        const pair = new WebSocketPair();
        const session = new WebsocketSession(pair[1], clientIp);
        this.websocketSessionsByClientIp.set(session.clientIP, session);
        return pair[0];
    }

    close(clientIp: string): void {
        this.websocketSessionsByClientIp.get(clientIp)?.close();
    }

    update(event: SyncEvent): void {
        this.websocketSessionsByClientIp.forEach((session: WebsocketSession) => {
            session.update(event)
        })
        console.log(`Sent event (${event.type}) to ${this.websocketSessionsByClientIp.size} websocket listeners`)
    }
}