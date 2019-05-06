import { Resolver } from '../Resolver';
import { Command } from '../../Command';
import { ToolkitClient as Client } from '../../../client';
import { Message } from '../../../types';

export class StringResolver extends Resolver {
    public constructor(client: Client) {
        super(client, 'String', 'string', 'str');
    }

    public validate(value: any): boolean {
        return typeof value === 'string';
    }

    public resolveRaw(value: string | string[]): string {
        return value instanceof Array ? value.join('\n') : value;
    }

    public resolve(_message: Message, _command: Command, _name: string, value: string | string[]): string {
        return this.resolveRaw(value);
    }
}
