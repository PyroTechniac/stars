import { Action } from '../base/Action';
import { Emoji } from '../../types';
import Storage, { Reference } from 'rejects';

export interface ActionableEmoji extends Emoji {
    guild_id: string;
}

export class EmojiAction extends Action<Emoji> {
    public reference(emoji: ActionableEmoji): Storage {
        return this.query.guilds[emoji.guild_id].emojis;
    }

    public format(emoji: ActionableEmoji) {
        const copy: any = Object.assign({}, emoji);
        if (emoji.user) copy.user = new Reference(`users.${emoji.user.id}`);
        return copy;
    }
}
