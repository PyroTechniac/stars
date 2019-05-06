import * as baseCommandNames from './static/baseCommandNames.json';
import { Time } from './Time';
import { Constructable } from 'discord.js';
import { AnyObj } from '../types';

export class Util {
    public static baseCommandNames: string[] = baseCommandNames;

    public static PRIMITIVE_TYPES: string[] = ['string', 'boolean', 'number', 'bigint']

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

    public static isObject(input: any): boolean {
        return input && input.constructor === Object;
    }

    public static isPrimitive(input: any): input is number | boolean | bigint | string {
        return this.PRIMITIVE_TYPES.includes(typeof input);
    }

    public static deepClone(source: any): any {
        if (source === null || this.isPrimitive(source)) return source;
        if (Array.isArray(source)) {
            const output = [];
            for (const value of source) output.push(this.deepClone(value));
            return output;
        }

        if (this.isObject(source)) {
            const output: AnyObj = {};
            for (const [key, value] of Object.entries(source)) output[key] = this.deepClone(value);
            return output;
        }

        if (source instanceof Map) {
            const output = new (source.constructor() as Constructable<Map<any, any>>)();
            for (const [key, value] of source.entries()) output.set(key, this.deepClone(value));
            return output;
        }

        if (source instanceof Set) {
            const output = new (source.constructor() as Constructable<Set<any>>)();
            for (const value of source.values()) output.add(this.deepClone(value));
            return output;
        }
        return source;
    }

    public static mergeDefault<T>(def: AnyObj, given: AnyObj): T {
        if (!given) return this.deepClone(def);
        for (const key in def) {
            if (typeof given[key] === 'undefined') given[key] = this.deepClone(def[key]);
            else if (this.isObject(given[key])) given[key] = this.mergeDefault(def[key], given[key]);
        }
        return given as any;
    }
}
