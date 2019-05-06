import { IStorageProvider } from '../interfaces';

export abstract class StorageProvider implements IStorageProvider {
    public abstract async init(): Promise<void>;
    public abstract async keys(): Promise<string[]>;
    public abstract async get(key: string): Promise<string | undefined>;
    public abstract async set(key: string, value: string): Promise<void>;
    public abstract async remove(key: string): Promise<void>;
    public abstract async clear(): Promise<void>;
}
