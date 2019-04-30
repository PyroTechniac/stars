import axios, { AxiosRequestConfig, AxiosResponse, AxiosAdapter } from 'axios';

function pause(n: number): Promise<void> {
    return new Promise(r => setTimeout(r, n));
}

export class Bucket {
    public static global: boolean = false;

    public static makeRoute(method: string, url: string): string {
        let route = url
            .replace(/\/([a-z-]+)\/(?:[0-9]{17,19})/g, (match, p) => p === 'channels' || p === 'guilds' || p === 'webhooks' ? match : `/${p}/:id`)
            .replace(/\/reactions\/[^/]+/g, '/reactions/:id')
            .replace(/^\/webhooks\/(\d+)\/[A-Za-z0-9-_]{64,}/, '/webhooks/$1/:token');

        if (method === 'delete' && route.endsWith('/messages/:id')) {
            route = method + route;
        }
        return route;
    }

    public queue: Array<{
        config: AxiosRequestConfig;
        resolve: (value?: AxiosResponse | PromiseLike<AxiosResponse>) => void;
        reject: (reason?: any) => void;
    }> = [];

    public limit: number = Infinity;

    public remaining: number = 1;

    public timeout: number = 0;

    protected _started: boolean = false;

    public get limited(): boolean {
        return (Bucket.global || this.remaining < 1) && (this.timeout > 0);
    }

    public clear(): void {
        Bucket.global = false;
        this.remaining = 1;
        this.timeout = 0;
    }

    public enqueue<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return new Promise<AxiosResponse<T>>((resolve, reject) => {
            this.queue.push({ config, resolve, reject });
            this._start();
        });
    }

    protected async _start(): Promise<void> {
        if (this._started) return;
        this._started = true;

        let entry;
        while (entry = this.queue.shift()) {
            if (this.limited) await pause(this.timeout);
            this.clear();

            try {
                var res = await (axios.defaults.adapter as AxiosAdapter)(entry.config);
            } catch (e) {
                entry.reject(e);
                continue;
            }
            const date = new Date(res.headers.date).valueOf();
            const {
                'x-ratelimit-global': globally,
                'x-ratelimit-limit': limit,
                'x-ratelimit-reset': reset,
                'x-ratelimit-remaining': remaining
            } = res.headers;

            Bucket.global = Boolean(globally);
            this.limit = Number(limit || Infinity);
            this.timeout = reset ? (Number(reset) * 1e3) - date : 0;
            this.remaining = Number(remaining || 1);

            if (res.status === 429) {
                this.timeout = Number(res.headers['retry-after'] || 0);
                this.queue.push(entry);
            } else if (res.status >= 500 && res.status < 600) {
                await pause(1e3 + Math.random() - 0.5);
                this.queue.push(entry);
            } else {
                entry.resolve(res);
            }
        }
        this._started = false;
    }
}
