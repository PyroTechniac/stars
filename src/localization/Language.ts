import { LangStringNode } from './LangStringNode';

export class Language {
    public strings: { [key: string]: LangStringNode } = {}
    public constructor(public name: string) { }

    public concat(lang: Language): void {
        if (lang.name !== this.name) throw new Error('Cannot concatenate strings for different languages');

        this.strings = { ...this.strings, ...lang.strings };
    }
}
