import { ToolkitClient as Client } from '../client/ToolkitClient';

export abstract class Event<T extends Client = Client> {
    public client!: T;

    public constructor(public name: string) { }

    public _register(client: T): void {
        this.client = client;
    }

    public abstract action(...args: any[]): void;
}
