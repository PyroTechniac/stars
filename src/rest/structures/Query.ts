import { AxiosInstance, AxiosRequestConfig } from 'axios';

export type ChainableQuery = Query & QueryObject;
export interface QueryObject {
    [key: string]: ChainableQuery;
}

export class Query {
    public readonly keys: string[] = [];

    public frozen: boolean = false;

    public constructor(public rest: AxiosInstance, start: string) {
        this.keys = [start];
    }

    public get endpoint(): string {
        return `/${this.keys.join('/')}`;
    }

    public post<T = any>(data: any, options?: AxiosRequestConfig): Promise<T> {
        return this.rest.post<T>(this.endpoint, data, options);
    }

    public get<T = any>(options?: AxiosRequestConfig): Promise<T> {
        return this.rest.get<T>(this.endpoint, options);
    }

    public put<T = any>(data: any, options?: AxiosRequestConfig): Promise<T> {
        return this.rest.put<T>(this.endpoint, data, options);
    }

    public delete<T = any>(options?: AxiosRequestConfig): Promise<T> {
        return this.rest.delete(this.endpoint, options);
    }

    public patch<T = any>(data: any, options?: AxiosRequestConfig): Promise<T> {
        return this.rest.patch<T>(this.endpoint, data, options);
    }

    public freeze(): true {
        return this.frozen = true;
    }

    protected _bind(prop: 'get' | 'post' | 'patch' | 'put' | 'delete'): any {
        return this.rest[prop].bind(this.rest, this.endpoint);
    }
}
