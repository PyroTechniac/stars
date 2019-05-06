import { ToolkitClient as Client } from '../client/ToolkitClient';
import { EventDispatcher } from './EventDispatcher';
import { Event } from './Event';

export class EventRegistry {
    private readonly _dispatcher: EventDispatcher;

    public events!: { [event: string]: Function[] }
    public constructor(client: Client) {
        this._dispatcher = new EventDispatcher(client, this);
        this.clearRegisteredEvents();
    }

    public clearRegisteredEvents(): void {
        this.events = {};
        this._dispatcher.clearListenedEvents();
    }

    public register(event: Event): void {
        const eventName: string = event.name;
        if (typeof this.events[eventName] === 'undefined') this.events[eventName] = [];

        this.events[eventName].push((...args: any[]) => event.action(...args));
        this._dispatcher.listen(eventName);
    }
}
