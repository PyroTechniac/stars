import Storage from 'rejects';
import { Client, QueryObject } from '../core/Client';
import * as Redis from 'ioredis';

export abstract class Action<T> {
    public static arrayToObject<T extends { [key: string]: any }>(arr: Array<T>, key = 'id') {
        const out: { [key: string]: T } = {};
        for (const elem of arr) out[elem[key]] = elem;
        return out;
    }

    public abstract reference(item: T): Storage;
    public abstract format(item: T): any;

    public constructor(public readonly client: Client) { }

    public get query(): QueryObject {
        return this.client.query;
    }

    public async set(item: T & { id: string }): Promise<any> {
        return this.reference(item).set(item.id, item);
    }

    public async upsert(item: T & {id: string}, pipeline?: Redis.Pipeline): Promise<any> {
        const format = this.format(item);
        await this.reference(item).upsert(item.id, format, pipeline);
        return format;
    }

    public async delete(item: T & {id: string}): Promise<T> {
        await this.reference(item).delete(item.id);
        return item;
    }
}
