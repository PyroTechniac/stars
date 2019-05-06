export interface IStorageProvider {
    init(): Promise<void>;
    keys(): Promise<string[]>;
    get(key: string): Promise<string | undefined>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
}
