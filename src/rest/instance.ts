import axios, { AxiosInstance } from 'axios';
import * as FormData from 'form-data';
import * as https from 'https';
import { adapt as adapter } from './adapter';


type USVString = string;

declare module 'axios' {
    class AxiosInstance {
        public get<T = any>(url: string, options?: AxiosRequestConfig): Promise<T>;
        public delete<T = any>(url: string, options?: AxiosRequestConfig): Promise<T>;
        public head<T = any>(url: string, options?: AxiosRequestConfig): Promise<T>;
        public options<T = any>(url: string, options?: AxiosRequestConfig): Promise<T>;
        public post<T = any>(endpoint: string, data: any, options?: AxiosRequestConfig): Promise<T>;
        public put<T = any>(url: string, data: any, options?: AxiosRequestConfig): Promise<T>;
        public patch<T = any>(endpoint: string, data: any, options?: AxiosRequestConfig): Promise<T>;
    }

    interface AxiosRequestConfig {
        reason?: string;
        files?: File | File[];
    }
}

export interface File {
    name: string;
    file: string | Buffer | NodeJS.ReadableStream | Blob | USVString;
}

export enum TokenType {
    BOT = 'Bot',
    BEARER = 'Bearer'
}

export interface Options {
    tokenType?: TokenType;
    base?: string;
    version?: number;
    agent?: https.Agent;
    ua?: string;
}

export default (token: string, options: Options = {}): AxiosInstance => {
    const instance = axios.create({
        adapter,
        baseURL: options.base || `https://discordapp.com/api/v${options.version || 6}`,
        httpsAgent: options.agent || undefined,
        headers: {
            'Authorization': `${options.tokenType || TokenType.BOT} ${token}`,
            'User-Agent': options.ua || `DiscordBot (https://github.com/starlight-ts/rest, ${require('../package.json').version})`
        },
        validateStatus: () => true
    });
    instance.interceptors.request.use(req => {
        if (req.files) {
            const form = new FormData();
            if (!Array.isArray(req.files)) req.files = [req.files];
            for (const f of req.files) form.append(f.name, f.file, f.name);
            if (typeof req.data !== undefined) form.append('payload_json', JSON.stringify(req.data));
            req.data = form;
            req.headers = Object.assign(req.headers, form.getHeaders());
            delete req.files;
        }

        if (req.reason) {
            req.headers['X-Audit-Log-Reason'] = req.reason;
            delete req.reason;
        }

        return req;
    });

    instance.interceptors.response.use(res => {
        if (res.status >= 200 && res.status < 300) return res.data;
        throw res;
    });

    return instance;
};
