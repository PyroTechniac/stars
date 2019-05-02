import * as Redis from 'ioredis';
import Storage from 'rejects';
import { GuildAction } from '../actions/Guild';
import { EmojiAction } from '../actions/Emoji';
import { RoleAction } from '../actions/Role';
import { ChannelAction } from '../actions/Channel';
import { VoiceStateAction } from '../actions/VoiceState';
import { GuildMemberAction } from '../actions/GuildMember';

export type ChainableQuery = Storage & QueryObject;
export interface QueryObject {
    [key: string]: ChainableQuery;
}

export interface ClientActions {
    guilds: GuildAction;
    members: GuildMemberAction;
    roles: RoleAction;
    emojis: EmojiAction;
    channels: ChannelAction
    voiceStates: VoiceStateAction;
}

export class Client {
    public query: this & QueryObject;
    public storage: Storage;

    public redis: Redis.Redis;
    public actions: ClientActions = {
        guilds: new GuildAction(this),
        members: new GuildMemberAction(this),
        roles: new RoleAction(this),
        emojis: new EmojiAction(this),
        channels: new ChannelAction(this),
        voiceStates: new VoiceStateAction(this)
    };

    public constructor(redis: Redis.Redis | Redis.RedisOptions) {}
}
