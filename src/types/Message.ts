import * as Discord from 'discord.js';
import { Guild } from './Guild';

export class Message extends Discord.Message {
    public guild!: Guild;
}
