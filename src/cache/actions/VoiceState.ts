import { Action } from '../base/Action';
import { VoiceState } from '../../types';
import Storage from 'rejects';
import { Pipeline } from 'ioredis';

export class VoiceStateAction extends Action<VoiceState> {
    public reference(state: VoiceState & { guild_id: string }): Storage {
        return this.query.guilds[state.guild_id].voice_states;
    }

    public format(state: VoiceState): VoiceState {
        return state;
    }

    public async upsert(state: VoiceState, pipeline: Pipeline): Promise<VoiceState> {
        if (!state.guild_id) {
            const channel = await this.query.channels.get(state.channel_id, { depth: 1 });
            if (!channel || !channel.guild_id) return state;

            state.guild_id = channel.guild_id;
        }

        await super.upsert(Object.assign(state, { id: state.user_id }), pipeline);
        return state;
    }
}
