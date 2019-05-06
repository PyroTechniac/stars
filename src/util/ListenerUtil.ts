import 'reflect-metadata';
import { EventEmitter } from 'events';

interface ListenerMetadata {
    event: string;
    method: string;
    once: boolean;
    args: any[];
    attached?: boolean;
}

export class ListenerUtil {
    public static registerListeners(emitter: EventEmitter, listenerSource?: object): void {
        if (!(emitter instanceof EventEmitter)) throw new TypeError('Listeners can only be registered on classes extending EventEmitter');

        const listenerTarget: object = typeof listenerSource !== 'undefined' ? listenerSource : emitter;
        const metaDataTarget: any = listenerTarget.constructor.prototype;
        const listeners: ListenerMetadata[] = Reflect.getMetadata('listeners', metaDataTarget);
        if (typeof listeners === 'undefined') return;

        for (const listener of listeners) {
            if (!(listenerTarget as any)[listener.method]) continue;
            if (listener.attached) continue;

            listener.attached = true;
            const eventHandler: (...eventArgs: any[]) => void = (...eventArgs) => (listenerTarget as any)[listener.method](...eventArgs, ...listener.args);

            emitter[listener.once ? 'once' : 'on'](listener.event, eventHandler);
        }
    }

    public static on(event: string, ...args: any[]): MethodDecorator {
        return ListenerUtil._setListenerMetadate(event, false, ...args);
    }

    public static once(event: string, ...args: any[]): MethodDecorator {
        return ListenerUtil._setListenerMetadate(event, true, ...args);
    }

    private static _setListenerMetadate(event: string, once: boolean, ...args: any[]): MethodDecorator {
        return function(target: object, key: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor {
            const listeners: ListenerMetadata[] = Reflect.getMetadata('listeners', target) || [];
            listeners.push({ event, method: key as string, once, args });
            Reflect.defineMetadata('listeners', listeners, target);
            return descriptor;
        };
    }
}
