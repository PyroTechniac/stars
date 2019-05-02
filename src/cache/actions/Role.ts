import { Action } from '../base/Action';
import { Role } from '../../types';
import Storage from 'rejects';

export interface ActionableRole extends Role {
    guild_id: string;
}

export class RoleAction extends Action<ActionableRole> {
    public reference(role: ActionableRole): Storage {
        return this.query.guilds[role.guild_id].roles;
    }

    public format(role: ActionableRole) {
        return role;
    }
}
