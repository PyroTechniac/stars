import { Message } from 'discord.js';

export class CommandLock {
    private _locks: { [guild: string]: boolean } = {}

    public constructor(public siblings: string[]) { }

    // @ts-ignore
    public lock(message: Message, args: any[]): void {
        this._locks[message.guild!.id] = true;
    }

    // @ts-ignore
    public isLocked(message: Message, args: any[]): boolean {
        return this._locks[message.guild!.id] || false;
    }
}
