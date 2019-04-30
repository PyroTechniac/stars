import axios, { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Bucket } from './structures/Bucket';

export const buckets: Map<string, Bucket> = new Map();

export async function adapt(config: AxiosRequestConfig): Promise<AxiosResponse> {
    const route = Bucket.makeRoute(config.method || 'get', config.url || '');
    let b = buckets.get(route);
    if (!b) {
        b = new Bucket();
        buckets.set(route, b);
    }

    return b.enqueue(config);
}
