import { ToolkitClient as Client } from '../../client';
import { Message } from '../../types';
import { Command } from '../Command';

export abstract class Resolver {
    public aliases: string[]
    public constructor(protected client: Client, public name: string, ...aliases: string[]) {
        this.aliases = aliases;
    }

    public abstract validate(value: any): any;
    public abstract resolve(message: Message, command: Command, name: string, value: string): any;

    // @ts-ignore
    public resolveRaw(value: string, context?: Partial<Message>): any { }
}
