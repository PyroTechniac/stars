import { Resolver } from './Resolver';
import { ToolkitClient as Client } from '../../client';
import { ResolverConstructor } from '../../types';

import { StringResolver } from './base';

export class ResolverLoader {
    public loaded: { [name: string]: Resolver } = {}
    private readonly _base: ResolverConstructor[]
    public constructor(private readonly _client: Client) {
        this._base = [
            StringResolver
        ];
    }

    public get(name: string): Resolver {
        return Object.values(this.loaded).find(r => r.name === name || r.aliases.includes(name));
    }

    public _loadResolvers(): void {
        for (const resolver of this._base.concat(this._client._customResolvers)) {
            const newResolver: Resolver = new resolver(this._client);
            this.loaded[newResolver.name] = newResolver;
        }
    }
}
