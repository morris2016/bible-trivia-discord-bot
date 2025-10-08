export class Logger {
    constructor(options = {}) {
        this.level = options.level || process.env.LOG_LEVEL || 'info';
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedLevel = level.toUpperCase().padEnd(5);
        return `[${timestamp}] ${formattedLevel} BibleTriviaBot: ${message}`;
    }

    error(message, ...args) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, ...args));
            if (args.length > 0) {
                console.error(...args);
            }
        }
    }

    warn(message, ...args) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, ...args));
            if (args.length > 0) {
                console.warn(...args);
            }
        }
    }

    info(message, ...args) {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, ...args));
        }
    }

    log(message, ...args) {
        this.info(message, ...args);
    }

    debug(message, ...args) {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, ...args));
            if (args.length > 0) {
                console.debug(...args);
            }
        }
    }

    // Specialized logging methods
    game(message, ...args) {
        this.log(`🎮 ${message}`, ...args);
    }

    api(message, ...args) {
        this.log(`📡 ${message}`, ...args);
    }

    discord(message, ...args) {
        this.log(`🤖 ${message}`, ...args);
    }

    performance(message, ...args) {
        this.log(`⚡ ${message}`, ...args);
    }
}
