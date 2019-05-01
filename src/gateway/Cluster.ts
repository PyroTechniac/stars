import { EventEmitter } from 'events';
import { Errors } from '../util';
import { ClusterableShard } from './ClusterableShard';
import { Gateway } from './Gateway';

export class Cluster extends EventEmitter {
    public gateway: Gateway;

    public readonly shards: Map<number, ClusterableShard> = new Map();

    public constructor(token: string | Gateway) {
        super();
        this.gateway = Gateway.fetch(token);
    }

    public spawn(): Promise<void>;
    public spawn(id: number): Promise<void>;
    public spawn(ids: number[]): Promise<void>;
    public spawn(min: number, max: number): Promise<void>
    public async spawn(minOrIDs?: number | number[], max?: number): Promise<void> {
        await this.gateway.fetch();

        if (typeof minOrIDs === 'undefined') {
            this.spawn(0, Infinity);
        } else if (Array.isArray(minOrIDs)) {
            minOrIDs.map(id => this.spawn(id));
        } else if (max !== undefined) {
            if (max > this.gateway.shards) max = this.gateway.shards - 1;
            for (; minOrIDs <= max; minOrIDs++) this.spawn(minOrIDs);
        } else {
            const existing = this.shards.get(minOrIDs);
            if (existing) existing.reconnect();
            else this.shards.set(minOrIDs, new ClusterableShard(this, minOrIDs));
        }
    }

    public kill(closeCode?: number): void {
        for (const shard of this.shards.values()) shard.disconnect(closeCode);
    }
}
