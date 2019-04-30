import { Base } from './Base';

export interface Role extends Base {
    color: number;
    hoist: boolean;
    position: number;
    permissions: number;
    managed: boolean;
    mentionable: boolean;
}
