import { Guild } from '../../types';
import { Pipeline } from 'ioredis'
import { Action } from '../base/Action';
import Storage, { Reference } from 'rejects';

export class GuildAction extends Action<Guild> {
	public reference(guild: Guild): Storage {
		return this.query.guilds;
	}

	public format(guild: Guild): Guild {
		const copy: any = Object.assign({}, guild);

		copy.roles = Action.arrayToObject(guild.roles);
		copy.emojis = Action.arrayToObject(guild.emojis);
		if (guild.voice_states) copy.voice_states = Action.arrayToObject(guild.voice_states);
		if (guild.channels) {
			copy.channels = {};
			for (const chan of guild.channels) copy.channels[chan.id] = new Reference(`channels.${chan.id}`);
		}

		if (guild.members) {
			copy.members = {};
			for (const member of guild.members) {
				copy.members[member.user.id] = this.actions.members.format(Object.assign(member, { guild_id: guild.id }));
			}
		}
		if (guild.presences) {
			for (const presence of guild.presences) {
				if (presence.user && copy.members[presence.user.id]) copy.members[presence.user.id].presence = presence;
			}

			delete copy.presences;
		}

		return copy;
	}

	public async upsert(item: Guild, pipeline?: Pipeline) {
		const pipe = pipeline || this.client.redis.multi();

		if (item.channels) for (const channel of item.channels) this.actions.channels.upsert(Object.assign(channel, { guild_id: item.id }), pipe);
		if (item.members) for (const member of item.members) this.client.query.users.upsert(member.user.id, member.user as any, pipe);

		const format = await super.upsert(item, pipe);
		if (!pipeline) await pipe.exec();
		return format;
	}
}