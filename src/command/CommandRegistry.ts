import { ToolkitClient as Client } from '../client/ToolkitClient';
import { Command } from './Command';
import { Collection } from 'discord.js';
import { Console, console } from '../util/console/Console';

export class CommandRegistry<T extends Client, K extends string = string, V extends Command<T> = Command<T>> extends Collection<K, V> {
    @console('CommandRegistry')
    private readonly _console!: Console;

    private readonly _client!: T;
    private readonly _reserved: ((() => string) | string)[]

    public constructor(client: T) {
        super();
        Object.defineProperty(this, '_client', { value: client });
        Object.defineProperty(this, '_reserved', {
            value: [
                () => this.has('limit' as K) ? 'clear' : null
            ]
        });
    }

    public static get [Symbol.species]() {
        return Collection;
    }

    public get groups(): string[] {
        return Array.from(new Set(this.map(c => c.group)));
    }

    public registerExternal(command: Command<any>): void {
        this._console.info(`External command loaded: ${command.name}`);
        this._registerInternal(command as V, true);
    }

    public _registerInternal(command: V, external: boolean = false): void {
        if (this.has(command.name as K)) {
            if (!this.get(command.name as K)!.external) this._console.info(`Replacing previously loaded command: ${command.name}`);
            else this._console.info(`Replacing externally loaded command: ${command.name}`);

            this.delete(command.name as K);
        }
        this.set(command.name as K, command);
        command._register(this._client);
        if (external) command.external = true;
    }
}
