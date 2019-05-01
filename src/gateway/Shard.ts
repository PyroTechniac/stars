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
        if (Array.isArray(data)) conv = new Uint8Array(Buffer.concat(data));
        else if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) conv = new Uint8Array(data);
        else conv = data;
        const suffix = conv.slice(conv.length - 4, conv.length);
        let flush = true;
        for (let i = 0; i < suffix.length; i++) {
            if (suffix[i] !== Shard.ZLIB_SUFFIX[i]) {
                flush = false;
                break
            }
        }

        this.inflate.push(conv, flush ? zlib.Z_SYNC_FLUSH : zlib.Z_NO_FLUSH);
        if (!flush) return;

        let result: string | number[] | Uint8Array = this.inflate.result;
        if (Array.isArray(result)) result = new Uint8Array(result);

        const decoded: Payload = decode(result);
        this.emit('receive', decoded);
        this.handlePayload(decoded);
    }

    private handlePayload(payload: Payload) {
        switch (payload.op) {
            case OP.DISPATCH:
                if (payload.s && payload.s > this.seq) this.seq = payload.s;
                if (payload.t === Dispatch.READY) this.session = payload.d.session_id;
                if (payload.t) this.emit(payload.t, payload.d);
                break
            case OP.HEARTBEAT:
                this.heartbeat();
                break;
            case OP.RECONNECT:
                this.reconnect();
                break;
            case OP.INVALID_SESSION:
                if (!payload.d) this.session = null;
                wait(Math.random() * 5 + 1).then(() => this.identify());
                break;
            case OP.HELLO:
                this._clearHeartbeater();
                this._heartbeater = setInterval(() => {
                    if (this._acked) {
                        this.heartbeat();
                        this._acked = false;
                    } else {
                        this.reconnect(4000);
                    }
                }, payload.d.heartbeat_interval);

                this.identify();
                break;
            case OP.HEARTBEAT_ACK:
                this._acked = true;
                break;
        }
    }

    private handleClose = (event: CloseEvent): void => {
        this.emit('close');
        this._reset();

        switch (event.code) {
            case 4004:
            case 4010:
            case 4011:
                this.emit('exit', event);
                return;
        }

        this.reconnect();
    }

    private handleError = (err: Event): void => {
        this.emit('error', err);
        this.backoff *= 2;
        this.reconnect();
    }

    private handleOpen = (event: Event): void => {
        this.backoff = 1e3;
        this.emit('open', event);
    }

    private _registerWSListeners() {
        this.ws.onmessage = this.receive;
        this.ws.onerror = this.handleError;
        this.ws.onclose = this.handleClose;
        this.ws.onopen = this.handleOpen;
    }

    private _clearWSListeners() {
        this.ws.onmessage = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onopen = null;
    }

    private _clearHeartbeater() {
        if (this._heartbeater) {
            clearInterval(this._heartbeater);
            this._heartbeater = undefined;
        }
    }

    private _reset() {
        this._clearHeartbeater();
        this._clearWSListeners();
        this.inflate = new zlib.Inflate();
        this.seq = 0;
    }
}