let erlpack: { pack: (d: any) => Buffer; unpack: (d: Buffer | Uint8Array) => any } | undefined;
if (typeof window === 'undefined') {
    try {
        erlpack = require('erlpack');
    } catch { }
}

import * as Errors from './Errors';
import { Permissions } from './Permissions';

export {
    Errors,
    Permissions
};

export const encoding = erlpack ? 'etf' : 'json';

export function encode(data: any): Buffer {
    if (Buffer.isBuffer(data)) return data;
    return erlpack ? erlpack.pack(data) : Buffer.from(JSON.stringify(data));
}

export function decode<T = any>(data: ArrayBuffer | string | Buffer[] | Buffer | Uint8Array): T {
    if (data instanceof ArrayBuffer) data = Buffer.from(data);
    else if (Array.isArray(data)) data = Buffer.concat(data);

    if (erlpack) {
        if (typeof data === 'string') data = Buffer.from(data);
        return erlpack.unpack(data as Uint8Array | Buffer);
    }

    if (Buffer.isBuffer(data)) data = data.toString();
    else if (typeof data !== 'string') data = Buffer.from(data).toString();
    return JSON.parse(data);
}
