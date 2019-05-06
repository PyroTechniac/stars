import { LogLevel, Transport, TransportFunction } from '../../types';
import { ConsoleType } from './ConsoleType';
export { console } from './ConsoleDecorator';

export class Console {
    private static _instance: Console;
    private _logLevel: LogLevel
    private _transports: Transport[]
    private _baseTransportRemoved: boolean

    public static _shard: string;

    private constructor() {
        if (Console._instance) throw new Error('Cannot create multiple console instances, use Console.instance() instead');

        Console._instance = this;
        this._logLevel = LogLevel.DEBUG;
        this._transports = [];
        this._baseTransportRemoved = false;

        type Color = [number, number];
        const colors: { [name: string]: Color } = {
            red: [31, 39],
            green: [32, 39],
            yellow: [33, 39],
            blue: [34, 39],
            magenta: [35, 39],
            cyan: [36, 39],
            grey: [90, 39]
        };

        const wrapColor = (c: Color, ...text: string[]): string => `\u001B[${c[0]}m${text.join(' ')}\u001B[${c[1]}m`;
        type ColorWrapper = (...text: string[]) => string;
        const createWrapper: (color: Color) => ColorWrapper =
            color => (...text): string => wrapColor(color, ...text); // eslint-disable-line

        interface LogTypeColorWrappers { [type: string]: ColorWrapper }
        const typeColorWrappers: LogTypeColorWrappers = {
            [ConsoleType.LOG]: createWrapper(colors.green),
            [ConsoleType.INFO]: createWrapper(colors.blue),
            [ConsoleType.WARN]: createWrapper(colors.yellow),
            [ConsoleType.ERROR]: createWrapper(colors.red),
            [ConsoleType.DEBUG]: createWrapper(colors.magenta)
        };

        const zeroPad: (n: string | number) => string = (n): string => `0${n}`.slice(-2);
        const shard = (): string => {
            const isSharded: boolean = typeof Console._shard !== 'undefined';
            const shardNum: string = (Console._shard || 0) < 10 ? zeroPad(Console._shard || 0) : Console._shard.toString();
            const shardTag: string = `[${wrapColor(colors.cyan), `SHARD_${shardNum}`}]`; // eslint-disable-line
            return isSharded ? shardTag : '';
        };

        const transport: TransportFunction = (data): void => {
            let { type, tag, text } = data;
            const d: Date = data.timestamp;
            const h: string = zeroPad(d.getHours());
            const m: string = zeroPad(d.getMinutes());
            const s: string = zeroPad(d.getSeconds());
            const t: string = wrapColor(colors.grey, `${h}:${m}:${s}`);

            type = typeColorWrappers[type](type);
            tag = wrapColor(colors.cyan, tag);

            process.stdout.write(`[${t}]${shard()}[${type}][${tag}]: ${text}\n`);
        };

        this.addTransport({ transport });
    }

    public static readonly NONE: LogLevel = LogLevel.NONE;

    public static readonly LOG: LogLevel = LogLevel.LOG

    public static readonly INFO: LogLevel = LogLevel.INFO;

    public static readonly WARN: LogLevel = LogLevel.WARN;

    public static readonly ERROR: LogLevel = LogLevel.ERROR;

    public static instance(tag?: string): Console {
        if (tag) return Console.taggedInstance(tag);
        return Console._instance || new Console();
    }

    private static taggedInstance(tag: string): Console {
        return new Proxy(Console.instance(), {
            get: (target: any, key: PropertyKey) => {
                switch (key) {
                case 'log':
                case 'info':
                case 'warn':
                case 'error':
                case 'debug':
                    return (...text: string[]) => target[key](tag, ...text);
                default: return target[key];
                }
            }
        });
    }

    public setLogLevel(level: LogLevel): void {
        this._logLevel = level;
    }

    public addTransport(transport: Transport): void {
        const level: LogLevel | (() => LogLevel) = transport.level;
        transport.level = typeof level === 'undefined' ? level : () => level as LogLevel;

        this._transports.push(transport);
    }

    public removeBaseTransport(): void {
        if (this._baseTransportRemoved) return;
        this._baseTransportRemoved = true;
        this._transports.shift();
    }

    public async log(tag: string, ...text: string[]): Promise<void> {
        this._write(LogLevel.LOG, ConsoleType.LOG, tag, text.join(' '));
    }

    public async info(tag: string, ...text: string[]): Promise<void> {
        this._write(LogLevel.INFO, ConsoleType.INFO, tag, text.join(' '));
    }

    public async warn(tag: string, ...text: string[]): Promise<void> {
        this._write(LogLevel.WARN, ConsoleType.WARN, tag, text.join(' '));
    }

    public async error(tag: string, ...text: string[]): Promise<void> {
        this._write(LogLevel.ERROR, ConsoleType.ERROR, tag, text.join(' '));
    }

    public async debug(tag: string, ...text: string[]): Promise<void> {
        this._write(LogLevel.DEBUG, ConsoleType.DEBUG, tag, text.join(' '));
    }

    private _write(level: LogLevel, type: ConsoleType, tag: string, text: string): void {
        const timestamp: Date = new Date();
        for (const t of this._transports) {
            if (level <= (t.level as () => LogLevel)()) {
                t.transport({ timestamp, type, tag, text });
            }
        }
    }
}
