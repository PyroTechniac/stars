import Storage from 'rejects';
import { Client } from '../core/Client';

export abstract class Action<T> {
	public static arrayToObject<T extends { [key: string]: any }>(arr: Array<T>, key = 'id') {
		const out: { [key: string]: T } = {};
		for (const elem of arr) out[elem[key]] = elem;
		return out;
	}

	public abstract reference(item: T): Storage;
	public abstract format(item: T): any;

	public constructor(public readonly client: Client) {}

	
}