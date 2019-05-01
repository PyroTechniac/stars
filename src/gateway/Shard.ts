import pako = require('pako');
import throttle from 'p-throttle';
import { Errors, encoding, encode, decode } from '../util';
import { Dispatch, OP, Presence } from '../types';

import { Gateway } from './Gateway';
import { ws as WebSocket } from './util/WebSocket';
import { zlib } from './util/zlib';
import { EventEmitter } from 'events';

declare module 'pako' {
    export const Z_NO_FLUSH = 0;
    export const Z_PARTIAL_FLUSH = 1;
    export const Z_SYNC_FLUSH = 2;
    export const Z_FULL_FLUSH = 3;
    export const Z_FINISH = 4;
}

const { Codes, StarsError } = Errors;

const isBlob = (v: unknown): v is Blob => {
    if (typeof v === 'undefined') return false;
    return v instanceof Blob
}

export const wait = (time: number) => new Promise<void>(r => setTimeout(r, time));

export type Identify = {
    token: string,
    properties: {
        $os: string,
        browser: string,
        device: string,
    },
    compress: string,
    large_threshold: number,
    shard: [number, number],
    presence: Partial<Presence>,
}

export type Payload = {
    t?: string,
    s?: number,
    op: number,
    d: any
}

export class Shard extends EventEmitter {
    public static readonly ZLIB_SUFFIX = new Uint8Array([0x00, 0x00, 0xff, 0xff])

    public gateway: Gateway;

    public readonly version: number = 6;

    public backoff: number = 1e3;

    public identify: (pk?: Partial<Identify>) => Promise<void>

    public seq: number = 0;

    public session: string | null = null;

    public ws!: WebSocket;

    public inflate: pako.Inflate = new zlib.Inflate()

    private _heartbeater?: NodeJS.Timer = undefined;

    private _acked: boolean = true;

    public constructor(token: string | Gateway, public readonly id: number) {
        super();

        this.gateway = Gateway.fetch(token);
        this.identify = this.gateway.identify.bind(this.gateway, this);
        this.send = throttle(this.send.bind(this), 120, 60) as any;

        this.connect().catch(e => this.emit('error', e))
    }

    public async connect(): Promise<void> {
        if (this.ws) {
            switch (this.ws.readyState) {
                case WebSocket.CONNECTING:
                case WebSocket.CLOSING:
                    return;
                case WebSocket.OPEN:
                    this.disconnect();
            }
        }

        await this.gateway.fetch();
        this.emit('connect');

        this.ws = new WebSocket(`${this.gateway.url}?v=${this.version}&encoding=${encoding}&compress=zlib-stream`);
        this._registerWSListeners();
        this._acked = true;
    }

    public send(pk: Buffer | Blob | ArrayBuffer | Payload): void;
    public send(op: OP | keyof typeof OP, d: any): void;
    public send(op: OP | Buffer | Blob | ArrayBuffer | Payload | keyof typeof OP, d?: any): void;
    public send(op: OP | Buffer | Blob | ArrayBuffer | Payload | keyof typeof OP, d?: any): void {
        if (Buffer.isBuffer(op) || isBlob(op) || op instanceof ArrayBuffer) {
            this.emit('send', op);
            return this.ws.send(op);
        }

        let data: Payload;
        switch (typeof op) {
            case 'object':
                data = op;
                break;
            case 'string':
                op = OP[op]; // intentional fallthrough
            case 'number':
                data = { op, d };
                break;
            default:
                throw new Error(`Invalid op type "${typeof op}"`);
        }

        this.emit('send', data);
        return this.ws.send(encode(data));
    }

    public disconnect(code?: number, reason?: string): void {
        if ([WebSocket.CLOSED, WebSocket.CLOSING].includes(this.ws.readyState)) return;
        this.emit('disconnect');
        this._reset()

        this.ws.close(code, reason);
    }

    public async reconnect(code?: number): Promise<void> {
        this.disconnect(code);
        await wait(this.backoff);
        this.connect();
    }

    public resume(): void {
        if (!this.session) throw new StarsError(Codes.NO_SESSION);

        return this.send(OP.RESUME, {
            token: this.gateway.token,
            seq: this.seq,
            session_id: this.session
        })
    }

    public heartbeat(): void {
        return this.send(OP.HEARTBEAT, this.seq);
    }

    public receive = ({ data }: MessageEvent): void => {
        let conv: Uint8Array | string;
    }

    private _registerWSListeners() {
        this.ws.onmessage = this.receive;
        this.ws.onerror = this.handleError;
        this.ws.onclose = this.handleClose;
        this.ws.onopen = this.handleOpen;
    }
}