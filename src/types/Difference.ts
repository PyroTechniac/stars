export interface Difference {
    raw: number;
    days?: number;
    hours?: number;
    mins?: number;
    secs?: number;
    ms: number;
    toString(): string;
    toSimplifiedString(): string;
}
