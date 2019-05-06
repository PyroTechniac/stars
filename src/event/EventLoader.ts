import * as glob from 'glob';
import * as path from 'path';
import { Event } from './Event';
import { Util } from '../util/Util';
import { ToolkitClient as Client } from '../client/ToolkitClient';
import { EventRegistry } from './EventRegistry';
import { console, Console } from '../util/console/Console';

export class EventLoader {
    @console('EventLoader')
    private readonly _console!: Console;

    private readonly _sources: string[] = []
    private readonly _registry: EventRegistry = new EventRegistry(this._client);

    public constructor(private readonly _client: Client) {
    }

    public addSource(dir: string): void {
        const resolved = path.resolve(dir);
        if (this._sources.includes(resolved)) return;
        this._sources.push(resolved);
    }

    public hasSources(): boolean {
        return this._sources.length > 0;
    }

    public loadEvents(): number {
        this._clearEvents();

        let loadedEvents = 0;
        for (const source of this._sources) loadedEvents += this._loadEvents(source);
        return loadedEvents;
    }

    private _clearEvents(): void {
        this._registry.clearRegisteredEvents();
    }

    private _loadEvents(dir: string): number {
        let eventFiles: string[] = glob.sync(`${dir}/**/*.js`);

        if (this._client.tsNode) {
            eventFiles.push(...glob.sync(`${dir}/**/!(*.d).ts`));
            const filteredEventFiles = eventFiles.filter(f => {
                const file: string = f.match(/\/([^\/]+?)\.[j|t]s$/)![1];
                if (f.endsWith('.ts')) return true;
                if (f.endsWith('.js')) return !eventFiles.find(cf => cf.endsWith(`${file}.ts`));
            });
            eventFiles = filteredEventFiles;
        }

        const loadedEvents: Event[] = [];
        this._console.debug(`Loading events in: ${dir}`);

        for (const file of eventFiles) {
            delete require.cache[require.resolve(file)];

            const loadedFile: any = require(file); // eslint-disable-line
            const eventClasses: (new () => Event)[] = this._findEventClasses(loadedFile);

            if (eventClasses.length === 0) {
                this._console.warn(`Failed to find Event class in file: ${file}`);
                continue;
            }

            for (const eventClass of eventClasses) {
                const eventInstance: Event = new eventClass();

                this._console.info(`Loaded Event handler for event: ${eventInstance.name}`);
                loadedEvents.push(eventInstance);
            }
        }

        for (const event of loadedEvents) {
            event._register(this._client);
            this._registry.register(event);
        }

        return loadedEvents.length;
    }

    private _findEventClasses(obj: any): (new () => Event)[] {
        const foundClasses: ((new () => Event) | (new () => Event)[])[] = [];
        const keys: string[] = Object.keys(obj);
        if (Event.prototype.isPrototypeOf(obj.prototype)) { foundClasses.push(obj); } else if (keys.length > 0) {
            for (const key of keys) {
                if (Event.prototype.isPrototypeOf(obj[key].prototype)) foundClasses.push(this._findEventClasses(obj[key]));
            }
        }

        return Util.flattenArray(foundClasses);
    }
}
