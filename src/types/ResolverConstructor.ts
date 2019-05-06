import { ToolkitClient as Client } from '../client';
import { Resolver } from '../command/resolvers/Resolver';

export type ResolverConstructor = new (client: Client) => Resolver
