import { Shard } from './Shard';
import { Cluster } from './Cluster';

export class ClusterableShard extends Shard {
	public constructor(public cluster: Cluster, id: number) {
		super(cluster.gateway, id);
	}

	public emit(name: string | symbol, ...args: any[]) {
		if (this.listenerCount(name)) super.emit(name, ...args);
		return this.cluster.emit(name, ...args, this);
	}
}