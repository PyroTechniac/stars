import { Console } from './Console';

export function console(key: string): PropertyDecorator;
export function console<T>(target: T, key: string): void;

export function console(...args: any[]): any {
    if (typeof args[0] === 'string') {
        return (target: any, key: string) => {
            Object.defineProperty(target, key, { value: Console.instance(args[0]) });
        };
    }
    Object.defineProperty(args[0], args[1], { value: Console.instance() });
}
