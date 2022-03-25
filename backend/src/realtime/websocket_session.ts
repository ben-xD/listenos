import {SyncEvent} from "../types";

export class WebsocketSession {
    clientIP: string;
    private websocket: WebSocket;

    constructor(websocket: WebSocket, clientIP: string) {
        this.websocket = websocket;
        this.clientIP = clientIP;
        websocket.accept()
    }

    update(event: SyncEvent): void {
        this.websocket.send(JSON.stringify(event));
    }

    close(): void {
        this.websocket.close()
    }
}

