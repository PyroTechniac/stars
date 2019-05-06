import { CompiledTemplateScript } from './CompiledTemplateScript';
import { TemplateData } from '../types';

export class LangStringNode {
    public readonly args: { [key: string]: { isOptional: boolean; isArray: boolean; type: string } } = {}
    public readonly argsValidator: ((args: TemplateData) => void) | undefined;

    private static readonly _argsDirective: RegExp = /^(##! *<[^>]+?>)/m;
    private static readonly _validArgsDirective: RegExp = /^##! *(?!< *, *)<(?:(?: *, *)?\w+\?? *: *\w+(?:\[\])?)+>/m;
    private static readonly _argList: RegExp = /<([^>]+?)>/;
    private static readonly _allArgs: RegExp = /\w+\?? *: *\w+(?:\[\])?/g;
    private static readonly _singleArg: RegExp = /(\w+\??) *: *(\w+(?:\[\])?)/;

    private static readonly _validArgsTypes: string[] = ['string', 'number', 'boolean', 'any'];
    public constructor(public readonly lang: string, public readonly key: string, public readonly value: string, public readonly raw: string, public readonly scripts: CompiledTemplateScript[]) {
        if (LangStringNode._argsDirective.test(raw)) {
            if (!LangStringNode._validArgsDirective.test(raw)) {
                throw new TypeError(`In string \`${lang}::${key}\`: Malformed args directive`);
            }
            const directive: string = raw.match(LangStringNode._argsDirective)![1];
            const argList: string = directive.match(LangStringNode._argList)![1];
            const allArgs: string[] = argList.match(LangStringNode._allArgs)!;

            const isArrayType: (type: string) => boolean = type => /\w+\[\]/.test(type);
            const isOptionalArg: (arg: string) => boolean = arg => /\w+\?/.test(arg);

            const validateType: (type: string, val: any, arg: string, array: boolean) => void =
                (type, val, arg, array) => {
                    if (type === 'any') return;
                    if (typeof val === type) return;
                    throw new TypeError([
                        `String \`${lang}::${key}\`, ${array ? 'array ' : ''}arg \`${arg}\`:`,
                        `Expected type \`${type}\`, got ${typeof val}`
                    ].join(' '));
                };

            for (const arg of allArgs) {
                const parsedArg: RegExpMatchArray = arg.match(LangStringNode._singleArg);
                const argKey: string = parsedArg[1];
                const argType: string = parsedArg[2];
                const rawKey: string = isOptionalArg(argKey) ? argKey.slice(0, -1) : argKey;
                const rawType: string = isArrayType(argType) ? argType.slice(0.0 - 2) : argType;

                if (!LangStringNode._validArgsTypes.includes(rawType)) throw new TypeError(`in string \`${lang}::${key}\`: Type \`${argType}\` is not a valid arg type`);

                this.args[rawKey] = {
                    isOptional: isOptionalArg(argKey),
                    isArray: isArrayType(argType),
                    type: rawType
                };
            }

            this.argsValidator = args => {
                for (const argKey in this.args) {
                    const arg: {isOptional: boolean; isArray: boolean; type: string} = this.args[argKey];
                    const expectedType: string = `${arg.type}${arg.isArray ? '[]' : ''}`;

                    if (arg.isOptional && typeof args[argKey] === 'undefined') continue;
                    if (typeof args[argKey] === 'undefined') {
                        throw new TypeError([
                            `String \`${lang}::${key}\`, arg \`${argKey}\`:`,
                            `Expected type \`${expectedType}\`, got undefined`
                        ].join(' '));
                    }
                    if (arg.isArray) {
                        if (!Array.isArray(args[argKey])) throw new TypeError(`String \`${lang}::${key}\`, arg \`${argKey}\`: Expected Array`);
                        for (const val of args[argKey] as Array<any>) {
                            validateType(arg.type, val, argKey, true);
                        }
                    } else { validateType(arg.type, args[argKey], argKey, false); }
                }
            };
        }
    }
}
