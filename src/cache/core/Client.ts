import * as Redis from 'ioredis';
import Storage from 'rejects';

export type ChainableQuery = Storage & QueryObject;
export interface QueryObject {
    [key: string]: ChainableQuery;
}

export class Client {
    public query: this & QueryObject;
    public storage: Storage;

    public redis: Redis.Redis;
}
