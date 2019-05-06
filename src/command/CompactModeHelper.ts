import { Client } from '../client';
import { Message, GuildMember, User } from 'discord.js';

interface SingleUseButton { expires: number; consumed: boolean; emoji: string; action: Function }

export class CompactModeHelper {
    private static _instance: CompactModeHelper

    private readonly _client: Client;
    private readonly _buttons: { [identifier: string]: SingleUseButton }
    private constructor(client: Client) {
        if (CompactModeHelper._instance) throw new Error('Cannot create multiple instances of CompactModeHelper');

        this._client = client;
        this._buttons = {};

        this._client.on('messageReactionAdd', (reaction, user) => {
            const emojiIdentifier: string = reaction.emoji.id || reaction.emoji.name;
            const buttonIdentifier: string = `${reaction.message.id}:${emojiIdentifier}`;

            if (!(buttonIdentifier in this._buttons)) return;
            if (user.id !== reaction.message.author!.id) return;

            const button: SingleUseButton = this._buttons[buttonIdentifier];
            if (button.consumed || button.expires < Date.now()) return;

            button.consumed = true;
            button.action();
        });

        this._client.setInterval(() => {
            for (const identifier in this._buttons) {
                const button: SingleUseButton = this._buttons[identifier];
                if (button.consumed || button.expires < Date.now()) { delete this._buttons[identifier]; }
            }
        }, 30e3);
    }

    public static createInstance(client: Client) {
        CompactModeHelper._instance = new CompactModeHelper(client);
    }

    public static async registerButton(message: Message, emoji: string, action: Function, lifespan: number = 30e3): Promise<void> {
        if (!CompactModeHelper._instance) throw new Error('CompactModeHelper instance not created or unavailable');

        if (typeof emoji !== 'string') throw new TypeError('Emoji must be a unicode emoji, emoji ID, or client button key');
        if (CompactModeHelper._instance._client.buttons[emoji]) emoji = CompactModeHelper._instance._client.buttons[emoji];

        let clientMember!: GuildMember;
        let invokedImmediately = false;

        if (message.channel.type === 'text') {
            try {
                clientMember = await CompactModeHelper._instance._client.util.fetchMember(message.guild!, CompactModeHelper._instance._client.user.id, true);
            } catch { invokedImmediately = true; }
        }
        if (clientMember && !clientMember.permissionsIn(message.channel).has('ADD_REACTIONS')) invokedImmediately = true;
        if (!invokedImmediately) {
            await message.react(emoji);
            CompactModeHelper._instance._buttons[`${message.id}:${emoji}`] = { expires: Date.now() + lifespan, consumed: false, emoji, action };
        } else { action(); }
    }
}
