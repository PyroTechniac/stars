import { Script } from 'vm';

export class CompiledTemplateScript {
    public readonly func!: Function;
    public readonly implicitReturnFunc: Function | undefined
    public constructor(public readonly raw: string) {
        try { this.func = new Function('args', 'res', raw); } catch { }

        (this.func as any)._testScript = new Script(CompiledTemplateScript._functionWrap(raw));
        delete (this.func as any)._testScript;

        try {
            const functionBody: string = `return ${raw.replace(/^[\s]+/, '')}`;
            const implicitReturnFunc: Function = new Function('args', 'res', functionBody);
            this.implicitReturnFunc = implicitReturnFunc;
        } catch {}
    }

    private static _functionWrap(code: string) {
        return `function _(args, res) {\n${code}\n}`;
    }
}
