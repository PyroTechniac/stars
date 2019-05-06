export const DEFAULTS = {
    CONSOLE: {
        stdout: process.stdout,
        stderr: process.stderr,
        timestamps: true,
        utc: false,
        types: {
            debug: 'log',
            error: 'error',
            log: 'log',
            verbose: 'log',
            warn: 'warn',
            wtf: 'error'
        }
    }
};
