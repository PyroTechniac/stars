import { Action } from './base/Action';
import { Client, QueryObject } from './core/Client';
import { Redis } from 'ioredis';

export default function(redis: Redis): QueryObject {
    const client = new Client(redis);
    return client.query;
}

export {
    Action,
    Client
};
