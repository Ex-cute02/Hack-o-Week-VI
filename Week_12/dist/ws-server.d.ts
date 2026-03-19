import { WebSocketServer } from "ws";
import http from "http";
/**
 * Create and configure the WebSocket server.
 */
export declare function createWSServer(server: http.Server): WebSocketServer;
