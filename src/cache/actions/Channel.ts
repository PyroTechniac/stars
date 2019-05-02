import Storage, { Reference } from 'rejects';
import { Action } from '../base/Action';
import { Channel } from '../../types';

export class ChannelAction extends Action<Channel> {
    public reference(): Storage {
        return this.query.channels;
    }

    public format(channel: Channel) {
        const copy: any = Object.assign({}, channel);

        if (channel.permission_overwrites) copy.permission_overwrites = Action.arrayToObject(channel.permission_overwrites);
        if (channel.recipients) copy.recipients = channel.recipients.map(r => new Reference(`users.${r.id}`));

        return copy;
    }
}
