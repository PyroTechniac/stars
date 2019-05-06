import { StorageProvider } from './StorageProvider';
import { StorageProviderConstructor } from '../types';
import { Util } from '../util';

export class SingleProviderStorage {
    private readonly _storage: StorageProvider;

    public constructor(name: string, provider: StorageProviderConstructor) {
        this._storage = new provider(name);
    }

    public async init(): Promise<void> {
        await this._storage.init();
    }

    public async keys(): Promise<string[]> {
        return await this._storage.keys();
    }

    public async get(key: string): Promise<any> {
        if (typeof key === 'undefined') throw new TypeError('Key must be provided');
        if (typeof key !== 'string') throw new TypeError('Key must be a string');

        if (key.includes('.')) {
            const path: string[] = key.split('.');
            const stringData: string = (await this._storage.get(path.shift()));
            if (typeof stringData === 'undefined') return;
            const data: object = JSON.parse(stringData);
            return Util.getNestedValue(data, path);
        }

        const stringData: string = (await this._storage.get(key));
        if (typeof stringData === 'undefined') return;
        return JSON.parse(stringData);
    }

    public async exists(key: string): Promise<boolean> {
        return typeof await this.get(key) !== 'undefined';
    }

    public async set(key: string, value: any): Promise<void> {
        if (typeof key === 'undefined') throw new TypeError('Key must be a string');
        if (typeof key !== 'string') throw new TypeError('Key must be a string');
        if (typeof value === 'undefined') throw new TypeError('Value must be provided');

        try { JSON.stringify(value); } catch { value = {}; }

        let data: any;
    }
}
