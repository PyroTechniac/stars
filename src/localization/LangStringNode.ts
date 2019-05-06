import { CompiledTemplateScript } from './CompiledTemplateScript';
import { TemplateData } from '../types';

export class LangStringNode {
    public readonly lang: string;
    public readonly key: string;
    public readonly value: string;
    public readonly raw: string;
    public readonly scripts: CompiledTemplateScript[];
    public readonly args: { [key: string]: { isOptional: boolean; isArray: boolean; type: string } }
    public readonly argsValidator: ((args: TemplateData) => void) | undefined;

    private static readonly _argsDirective: RegExp = /^(##! *<[^>]+?>)/m;
    private static readonly _validArgsDirective: RegExp = /^##! *(?!< *, *)<(?:(?: *, *)?\w+\?? *: *\w+(?:\[\])?)+>/m;
    private static readonly _argList: RegExp = /<([^>]+?)>/;
    private static readonly _allArgs: RegExp = /\w+\?? *: *\w+(?:\[\])?/g;
    private static readonly _singleArg: RegExp = /(\w+\??) *: *(\w+(?:\[\])?)/;

    private static readonly _validArgsTypes: string[] = ['string', 'number', 'boolean', 'any'];
}
