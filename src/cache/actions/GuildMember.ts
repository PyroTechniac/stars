import {Action} from '../base/Action'
import {User} from '../../types';
import Storage, {Reference} from 'rejects';
import {Pipeline} from 'ioredis';

export interface GuildMemberActionable {
	guild_id: string;
	user: User;
	roles?: string[];
}

export class GuildMemberAction extends Action<GuildMemberActionable & {id: string}> {
	public reference(member: GuildMemberActionable): Storage {
		return this.query.guilds[member.guild_id].members;
	}

	public format(member: GuildMemberActionable) {
		const copy: any = Object.assign({}, member);
		copy.id = member.user.id;
		copy.user = new Reference(`users.${member.user.id}`);
		return copy
	}

	public async upsert(member: GuildMemberActionable & {id: string}, pipeline?: Pipeline) {
		const pipe = pipeline || this.client.redis.multi();

		await this.query.guilds[member.guild_id].incr('member_count');
		await this.query.users.upsert(member.user.id, member.user as any, pipe);

		const formatted = await super.upsert(member);
		if (!pipeline) await pipe.exec();
		return formatted;
	}

	public async delete(member: GuildMemberActionable & {id: string}) {
		await this.query.guilds[member.guild_id].incr('member_count', -1);
		return super.delete(member);
	}
}