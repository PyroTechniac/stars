import { Action } from '../base/Action';
import { Presence } from '../../types';
import { Pipeline } from 'ioredis';
import Storage from 'rejects';

export class PresenceAction extends Action<Presence> {
    public reference(presence: Presence): Storage {
        if (!presence.guild_id || !presence.user) throw new Error('Cannot set presence without guild/user data');
        return this.query.guilds[presence.guild_id].members[presence.user.id];
    }

    public format(presence: Presence) {
        if (!presence.guild_id || !presence.user) return null;

        const copy: any = Object.assign({}, presence);
        delete copy.user;
        return copy;
    }

    public async upsert(presence: Presence, pipeline?: Pipeline) {
        if (!presence.guild_id || !presence.user) return presence;
        await this.reference(presence).upsert('presence', this.format(presence), pipeline);
        return presence;
    }

    public async delete(presence: Presence) {
        await this.reference(presence).delete('presence');
        return presence;
    }
}
