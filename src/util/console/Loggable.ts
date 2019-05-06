import { Console } from './Console';

export type Constructable<T = {}> = new (...args: any[]) => T;
export interface ILoggable {
    console: Console;
}

class BaseLoggable {}

export function Loggable<T extends Constructable>(Base: T = BaseLoggable as any): Constructable<ILoggable> & T {
    return class extends Base {
        public readonly console: Console = Console.instance();
    };
}
