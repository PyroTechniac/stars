import { ToolkitClient as Client } from '../client/ToolkitClient';
import { EventRegistry } from './EventRegistry';

export class EventDispatcher {
    private _listenedEvents: string[] = [];
    private _listenedEventFns: { [event: string]: ((...args: any[]) => void)[] } = {}
    public constructor(private _client: Client, private _registry: EventRegistry) { }

    public clearListenedEvents(): void {
        this._listenedEvents = [];
        for (const event in this._listenedEventFns) {
            for (const fn of this._listenedEventFns[event]) {
                this._client.removeListener(event, fn);
            }

            delete this._listenedEventFns[event];
        }
    }

    public listen(event: string): void {
        if (this._listenedEvents.includes(event)) return;
        if (typeof this._listenedEventFns[event] === 'undefined') {
            this._listenedEventFns[event] = [];
        }

        const eventFn: (...args: any[]) => void = (...args) => {
            for (const e of this._registry.events[event]) e(...args);
        };

        this._listenedEvents.push(event);
        this._listenedEventFns[event].push(eventFn);

        this._client.on(event, eventFn);
    }
}
