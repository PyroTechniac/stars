import { Base } from './Base';
import { Channel } from './Channel';
import { Emoji } from './Emoji';
import { GuildMember, Presence, VoiceState } from './GuildMember';
import { Role } from './Role';

export enum DefaultMessageNotificationLevel {
    ALL_MESSAGES,
    ONLY_MENTIONS
}

export enum ExplicitContentFilterLevel {
    DISABLED,
    MEMBERS_WITHOUT_ROLES,
    ALL_MEMBERS
}

export enum MFALevel {
    NONE,
    ELEVATED
}

export enum VerificationLevel {
    NONE,
    LOW,
    MEDIUM,
    HIGH,
    VERY_HIGH
}

export interface UnavailableGuild extends Base {
    unavailable: true;
}

export interface AvailableGuild extends Base {
    name: string;
    icon?: string;
    splash?: string;
    owner?: boolean;
    owner_id: string;
    permissions?: number;
    region: string;
    afk_channel_id: string;
    afk_timeout: number;
    embed_enabled?: boolean;
    embed_channel_id?: string;
    verification_level: VerificationLevel;
    default_message_notifications: DefaultMessageNotificationLevel;
    explict_content_filter: ExplicitContentFilterLevel;
    roles: Role[];
    emojis: Emoji[];
    features: string[];
    mfa_level: MFALevel;
    application_id: string;
    widget_enabled: boolean;
    widget_channel_id?: string;
    system_channel_id?: string;
    joined_at?: string;
    large?: boolean;
    unavailable?: false;
    member_count?: number;
    members?: GuildMember[];
    voice_states?: VoiceState[];
    channels?: Channel[];
    presences?: Presence[];
}

export type Guild = UnavailableGuild & AvailableGuild;
