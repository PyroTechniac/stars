import { User } from './User';
import { Base } from './Base';

export enum ChannelType {
    GUILD_TEXT,
    DM,
    GUILD_VOICE,
    GROUP_DM,
    GUILD_CATEGORY
}

export interface PermissionOverwrite {
    id: string;
    type: 'role' | 'member';
    allow: number;
    deny: number;
}

export interface Channel extends Base {
    type: number;
    guild_id?: string;
    position?: number;
    permission_overwrites?: PermissionOverwrite[];
    name?: string;
    topic?: string;
    nsfw?: boolean;
    last_message_id?: string;
    bitrate?: number;
    user_limit?: number;
    recipients?: User[];
    icon?: string;
    owner_id?: string;
    application_id?: string;
    parent_id?: string;
    last_pin_timestamp?: string;
}
