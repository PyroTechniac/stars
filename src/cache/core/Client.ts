import * as Redis from 'ioredis';
import Storage from 'rejects';
import { GuildAction } from '../actions/Guild';
import { EmojiAction } from '../actions/Emoji';
import { RoleAction } from '../actions/Role';
import { ChannelAction } from '../actions/Channel';
import { VoiceStateAction } from '../actions/VoiceState';
import { GuildMemberAction } from '../actions/GuildMember';

const accessorKeys: string[] = ['get', 'set', 'upsert', 'delete', 'size', 'keys'];
type accessorKey = 'get' | 'set' | 'upsert' | 'delete' | 'size' | 'keys';

export type ChainableQuery = Storage & QueryObject;
export interface QueryObject {
    [key: string]: ChainableQuery;
}

export interface ClientActions {
    guilds: GuildAction;
    members: GuildMemberAction;
    roles: RoleAction;
    emojis: EmojiAction;
    channels: ChannelAction;
    voiceStates: VoiceStateAction;
}

export class Client {
    public query: this & QueryObject;
    public storage: Storage;

    public redis: Redis.Redis;
    public actions: ClientActions

    public constructor(redis: Redis.Redis | Redis.RedisOptions) {
        this.redis = redis instanceof Redis ? redis : new Redis(redis);
        this.storage = new Storage(this.redis);

        this.query = new Proxy(this as this & QueryObject, {
            get: (target, prop) => {
                if (prop in target) return (target as any)[prop];

                const args: PropertyKey[] = [prop];
                const p: ChainableQuery = new Proxy({} as ChainableQuery, {
                    get: (target, prop) => {
                        if (prop in target) return (target as any)[prop];

                        if (accessorKeys.includes(prop.toString())) {
                            return new Proxy((this.storage)[prop.toString() as accessorKey], {
                                apply: (target, thisArg, incArgs) => {
                                    let key: PropertyKey[] = [...args];
                                    if (typeof incArgs[0] === 'string') key = key.concat(...incArgs.shift().split('.'));

                                    return target.call(this.storage, key.join('.'), ...incArgs);
                                }
                            });
                        }

                        if (prop in this.storage) return (this.storage as any)[prop];

                        args.push(prop);
                        return p;
                    }
                });

                return p;
            }
        });

        this.actions = {
            guilds: new GuildAction(this),
            members: new GuildMemberAction(this),
            roles: new RoleAction(this),
            emojis: new EmojiAction(this),
            channels: new ChannelAction(this),
            voiceStates: new VoiceStateAction(this)
        };
    }
}
