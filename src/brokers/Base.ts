import { EventEmitter } from 'events';
import { decode, encode } from '../util';

export interface SendOptions {
    expiration?: number;
}

export abstract class Broker<Send, Receive> extends EventEmitter {
    public handlers: { [name: string]: (data: Receive) => Promise<Send> | Send | void } = {};
    private _responses: { [key: string]: (data: Receive) => void } = {};

    public abstract publish(event: string, data: Send, options?: SendOptions): any;

    public abstract call(method: string, data: Send, ...args: any[]): any;

    public subscribe(events: string | string[], handler: (event: string, data: Receive) => Promise<Send> | Send | void): any {
        if (!Array.isArray(events)) events = [events];
        for (const e of events) this.handlers[e] = handler.bind(this, e);
        return this._subscribe(events);
    }

    public unsubscribe(events: string | string[]): any {
        if (!Array.isArray(events)) events = [events];
        for (const e of events) delete this.handlers[e];
        return this._unsubscribe(events);
    }

    protected abstract _subscribe(events: string[]): any;
    protected abstract _unsubscribe(events: string[]): any;

    protected async _handleMessage(event: string, message: Buffer | Receive): Promise<Buffer | undefined> {
        if (Buffer.isBuffer(message)) message = decode<Receive>(message);
        if (this.handlers[event]) {
            let res = this.handlers[event](message);

            if (res) {
                try {
                    if (res instanceof Promise) res = await res;
                    return encode(res);
                } catch (e) {
                    this.emit('error', e);
                }
            } else if (this._responses[event]) {
                const res = this._responses[event];
                delete this._responses[event];
                res(message);
            } else {
                throw new Error(`No listener registered for event "${event}"`);
            }
        }
    }

    protected _awaitResponse(id: string, expiration?: number) {
        return new Promise<Receive>((resolve, reject) => {
            let timeout: NodeJS.Timer;

            if (expiration && expiration >= 0) {
                timeout = setTimeout(() => {
                    delete this._responses[id];
                    reject(new Error('Callback exceeded time limit'));
                }, expiration);
            }

            const listener = (response: Receive) => {
                clearTimeout(timeout);
                resolve(response);
            };

            this._responses[id] = listener;
        });
    }
}
