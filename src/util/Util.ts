import * as baseCommandNames from './static/baseCommandNames.json';
import { Time } from './Time';

export class Util {
    public static baseCommandNames: string[] = baseCommandNames;

    public static assignNestedValue(obj: any, path: string[], value: any): void {
        if (typeof obj !== 'object' || obj instanceof Array) { throw new Error(`Initial input of type '${typeof obj}' is not valid for nested assignment`); }

        if (path.length === 0) { throw new Error('Missing nested assignment path'); }

        const first: string = path.shift()!;
        if (typeof obj[first] === 'undefined') obj[first] = {};
        if (path.length > 1 && (typeof obj[first] !== 'object' || obj[first] instanceof Array)) { throw new Error(`Target '${first}' is not valid for nested assignment.`); }

        if (path.length === 0) obj[first] = value;
        else Util.assignNestedValue(obj[first], path, value);
    }

    public static removeNestedValue(obj: any, path: string[]): void {
        if (typeof obj !== 'object' || obj instanceof Array) return;
        if (path.length === 0) { throw new Error('Missing nested assignment path'); }

        const first: string = path.shift()!;
        if (typeof obj[first] === 'undefined') return;
        if (path.length > 1 && (typeof obj[first] !== 'object' || obj[first] instanceof Array)) { return; }

        if (path.length === 0) delete obj[first];
        else Util.removeNestedValue(obj[first], path);
    }

    public static getNestedValue(obj: any, path: string[]): any {
        if (typeof obj === 'undefined') return;
        if (path.length === 0) return obj;

        const first: string = path.shift()!;
        if (typeof obj[first] === 'undefined') return;
        if (path.length > 1 && (typeof obj[first] !== 'object' || obj[first] instanceof Array)) { return; }

        return Util.getNestedValue(obj[first], path);
    }

    public static parseRateLimit(limitString: string): [number, number] {
        const limitRegex: RegExp = /^(\d+)\/(\d+)(s|m|h|d)?$/;
        if (!limitRegex.test(limitString)) {
            throw new TypeError(`Failed to parse a ratelimit from '${limitString}'`);
        }

        let [limit, duration, post]: [string | number, string | number, string] = limitRegex.exec(limitString)!.slice(1, 4) as [string, string, string];

        if (post) duration = Time.parseShorthand(duration + post);
        else duration = Number.parseInt(duration as string);
        limit = Number.parseInt(limit as string);

        return [limit, duration];
    }

    public static flattenArray<T>(array: (T | T[])[]): T[] {
        const result: T[] = [];
        for (const item of array) {
            item instanceof Array ? result.push(...Util.flattenArray(item)) : result.push(item);
        }

        return result;
    }
}
