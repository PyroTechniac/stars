import { Broker } from './Base';
import { decode } from '../util';

export class Local<T> extends Broker<T, T> {
    public async publish(event: string, data: T): Promise<T> {
        await this._handleMessage(event, data);
        return data;
    }

    public call(method: string, data: T): Promise<T> {
        const res = this.publish(method, data);
        if (res) return res;
        return Promise.reject(new Error(`No handler for method ${method}`));
    }

    protected _subscribe(): void {
        // Do nothing
    }

    protected _unsubscribe(): void {
        // Do nothing
    }
}
