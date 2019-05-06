import { RateLimit } from './RateLimit';
import { Util } from '../util/Util';

interface NestedRateLimit { [descriptor: string]: NestedRateLimit | RateLimit }

export class RateLimitManager {
    private readonly _ratelimits: NestedRateLimit = {};

    public constructor() {
        setInterval(() => this._cleanup(this._ratelimits), 30e3);
    }

    public get(limit: string, ...descriptors: string[]): RateLimit {
        let ratelimit: RateLimit = Util.getNestedValue(this._ratelimits, [...descriptors, limit]);
        if (ratelimit) return ratelimit;

        ratelimit = new RateLimit(Util.parseRateLimit(limit));
        Util.assignNestedValue(this._ratelimits, [...descriptors, limit], ratelimit);

        return ratelimit;
    }

    public call(limit: string, ...descriptors: string[]): boolean {
        return this.get(limit, ...descriptors).call();
    }

    private async _cleanup(target: NestedRateLimit): Promise<void> {
        for (const key of Object.keys(target)) {
            if (target[key] instanceof RateLimit) {
                const ratelimit: RateLimit = target[key] as RateLimit;
                if ((Date.now() - ratelimit.expires) > (ratelimit.duration + 10e3)) delete target[key];
            } else if (Object.keys(target[key]).length === 0) { delete target[key]; } else { this._cleanup(target[key] as NestedRateLimit); }
        }
    }
}
