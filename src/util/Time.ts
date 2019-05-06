import { Difference } from '../types';

export class Time {
    public static parseShorthand(shorthand: string): number | null {
        let duration: number | null; let match: RegExpMatchArray;
        if (/^\d+(?:\.\d+)?(?:s(?:ecs?)?|m(?:ins?)?|h(?:rs?|ours?)?|d(?:ays?)?)$/.test(shorthand)) {
            match = shorthand.match(/^(\d+(?:\.\d+)?)(s|m|h|d)/)!;
            duration = Number.parseFloat(match[1]);
            duration = match[2] === 's'
                ? duration * 1000 : match[2] === 'm'
                    ? duration * 1000 * 60 : match[2] === 'h'
                        ? duration * 1000 * 60 * 60 : match[2] === 'd'
                            ? duration * 1000 * 60 * 60 * 24 : null;
        }

        return duration;
    }
}
