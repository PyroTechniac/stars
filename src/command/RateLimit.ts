export class RateLimit {
    private _count!: number;
    private _notified!: boolean;

    public readonly limit: number;
    public readonly duration: number;
    public expires!: number;

    public constructor(limit: [number, number]) {
        this.limit = limit[0];

        this.duration = limit[1];

        this._reset();
    }

    private _reset(): void {
        this.expires = 0;
        this._count = 0;
        this._notified = false;
    }

    public call(): boolean {
        if (this.expires < Date.now()) this._reset();
        if (this._count >= this.limit) return false;
        this._count++;
        if (this._count === 1) this.expires = Date.now() + this.duration;
        return true;
    }

    public get isLimited(): boolean {
        return (this._count >= this.limit) && (Date.now() < this.expires);
    }

    public get remaining(): number {
        return (((this.limit - this._count) === 0 && !this.isLimited))
            ? this.limit
            : this.limit - this._count;
    }

    public get wasNotified(): boolean {
        return this._notified;
    }

    public setNotified(): void {
        this._notified = true;
    }
}
