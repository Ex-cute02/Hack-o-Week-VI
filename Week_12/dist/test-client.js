"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
/**
 * Test client that simulates a wearable device streaming health telemetry.
 *
 * Usage:
 *   npx ts-node src/test-client.ts [numClients]
 *
 * Defaults to 3 simulated clients if no argument provided.
 */
const NUM_CLIENTS = parseInt(process.argv[2] || "3", 10);
const WS_URL = `ws://localhost:${config_1.config.WS_PORT}`;
function generateJWT(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId }, config_1.config.JWT_SECRET, { expiresIn: "1h" });
}
function randomBPM() {
    return Math.floor(60 + Math.random() * 120); // 60-180 BPM
}
function randomSteps() {
    return Math.floor(Math.random() * 50);
}
function createClient(userId, deviceId) {
    const ws = new ws_1.default(WS_URL);
    const token = generateJWT(userId);
    let messageCount = 0;
    ws.on("open", () => {
        console.log(`[${userId}] Connected. Sending auth...`);
        // Send auth frame
        ws.send(JSON.stringify({
            type: "auth",
            token,
        }));
    });
    ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        const prefix = `[${userId}]`;
        if (msg.type === "ack" && messageCount === 0) {
            console.log(`${prefix} Authenticated! Starting telemetry stream...`);
            // Stream telemetry every 1.5 seconds (within rate limit)
            const interval = setInterval(() => {
                messageCount++;
                const payload = {
                    type: "telemetry",
                    data: {
                        timestamp: new Date().toISOString(),
                        device_id: deviceId,
                        heart_rate: randomBPM(),
                        steps: randomSteps(),
                    },
                };
                ws.send(JSON.stringify(payload));
                console.log(`${prefix} Sent telemetry #${messageCount}: HR=${payload.data.heart_rate}, Steps=${payload.data.steps}`);
                if (messageCount >= 10) {
                    clearInterval(interval);
                    console.log(`${prefix} Done streaming. Closing connection.`);
                    ws.close(1000, "Client done");
                }
            }, 1500);
        }
        else if (msg.type === "ack") {
            console.log(`${prefix} ACK received for message #${messageCount}`);
        }
        else if (msg.type === "error") {
            console.error(`${prefix} ERROR: ${msg.error} (code: ${msg.code})`);
        }
        else if (msg.type === "rate_limited") {
            console.warn(`${prefix} RATE LIMITED: ${msg.error}`);
        }
    });
    ws.on("close", (code, reason) => {
        console.log(`[${userId}] Disconnected (code=${code}, reason=${reason.toString()})`);
    });
    ws.on("error", (err) => {
        console.error(`[${userId}] Error: ${err.message}`);
    });
}
// Edge case test client: sends malformed data, expired timestamps, rapid messages
function createEdgeCaseClient() {
    const userId = "usr_edgecase";
    const ws = new ws_1.default(WS_URL);
    const token = generateJWT(userId);
    ws.on("open", () => {
        console.log(`[EDGE] Connected. Sending auth...`);
        ws.send(JSON.stringify({ type: "auth", token }));
    });
    ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ack" && msg.status === "success") {
            console.log(`[EDGE] Authenticated. Running edge case tests...`);
            // Test 1: Malformed JSON
            setTimeout(() => {
                console.log("[EDGE] Test 1: Sending malformed JSON...");
                ws.send("{broken json!!!");
            }, 500);
            // Test 2: Missing fields
            setTimeout(() => {
                console.log("[EDGE] Test 2: Sending missing fields...");
                ws.send(JSON.stringify({ type: "telemetry", data: {} }));
            }, 1500);
            // Test 3: Timestamp too far in the past
            setTimeout(() => {
                console.log("[EDGE] Test 3: Sending old timestamp...");
                ws.send(JSON.stringify({
                    type: "telemetry",
                    data: {
                        timestamp: "2020-01-01T00:00:00Z",
                        device_id: "test",
                        heart_rate: 80,
                        steps: 10,
                    },
                }));
            }, 2500);
            // Test 4: Timestamp too far in the future
            setTimeout(() => {
                console.log("[EDGE] Test 4: Sending future timestamp...");
                ws.send(JSON.stringify({
                    type: "telemetry",
                    data: {
                        timestamp: "2030-01-01T00:00:00Z",
                        device_id: "test",
                        heart_rate: 80,
                        steps: 10,
                    },
                }));
            }, 3500);
            // Test 5: Invalid heart rate
            setTimeout(() => {
                console.log("[EDGE] Test 5: Sending invalid heart rate...");
                ws.send(JSON.stringify({
                    type: "telemetry",
                    data: {
                        timestamp: new Date().toISOString(),
                        device_id: "test",
                        heart_rate: 999,
                        steps: 10,
                    },
                }));
            }, 4500);
            // Test 6: Valid message after errors (socket should still be open)
            setTimeout(() => {
                console.log("[EDGE] Test 6: Sending valid message...");
                ws.send(JSON.stringify({
                    type: "telemetry",
                    data: {
                        timestamp: new Date().toISOString(),
                        device_id: "test_device",
                        heart_rate: 72,
                        steps: 5,
                    },
                }));
            }, 6000);
            // Close after all tests
            setTimeout(() => {
                console.log("[EDGE] All edge case tests complete.");
                ws.close(1000, "Edge case tests done");
            }, 8000);
        }
        else {
            console.log(`[EDGE] Response: ${JSON.stringify(msg)}`);
        }
    });
    ws.on("close", (code) => {
        console.log(`[EDGE] Disconnected (code=${code})`);
    });
    ws.on("error", (err) => {
        console.error(`[EDGE] Error: ${err.message}`);
    });
}
// Generate JWT helper for external use
function createTestToken(userId) {
    const token = generateJWT(userId);
    console.log(`\nGenerated JWT for user "${userId}":`);
    console.log(token);
    console.log();
}
// Main
console.log("=================================================");
console.log("  Health Telemetry Pipeline - Test Client");
console.log(`  Connecting ${NUM_CLIENTS} client(s) to ${WS_URL}`);
console.log("=================================================\n");
// Create normal clients
for (let i = 1; i <= NUM_CLIENTS; i++) {
    const userId = `usr_${String(i).padStart(5, "0")}`;
    const deviceId = `device_${i}`;
    setTimeout(() => createClient(userId, deviceId), i * 200);
}
// Create an edge case test client
setTimeout(() => createEdgeCaseClient(), (NUM_CLIENTS + 1) * 200);
// Generate a sample token for manual testing
createTestToken("usr_manual_test");
//# sourceMappingURL=test-client.js.map