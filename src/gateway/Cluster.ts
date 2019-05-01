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
}