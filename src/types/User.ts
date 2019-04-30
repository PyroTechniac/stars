import { Base } from './Base';

export interface User extends Base {
    username: string;
    discriminator: string;
    avatar?: string;
    bot?: boolean;
    mfa_enabled?: boolean;
    verified?: boolean;
    email?: string;
}
