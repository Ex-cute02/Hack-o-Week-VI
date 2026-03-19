"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    write(level, message, meta = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta,
        };
        const line = JSON.stringify(entry);
        if (level === "error") {
            process.stderr.write(line + "\n");
        }
        else {
            process.stdout.write(line + "\n");
        }
    }
    info(message, meta) {
        this.write("info", message, meta);
    }
    warn(message, meta) {
        this.write("warn", message, meta);
    }
    error(message, meta) {
        this.write("error", message, meta);
    }
    debug(message, meta) {
        if (process.env.LOG_LEVEL === "debug") {
            this.write("debug", message, meta);
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map