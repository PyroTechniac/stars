import { Console } from 'console'
import { inspect } from 'util'
import { Colors } from './Colors'
import * as constants from './Constants'
import { Util } from './Util'
import { ConsoleOptions, AnyObj } from '../types'
import { WriteStream } from 'tty'
const { mergeDefault } = Util

export class ToolkitConsole extends Console {
	public readonly stdout: NodeJS.WritableStream & WriteStream;
	public readonly stderr: NodeJS.WritableStream & WriteStream;
	public colors: AnyObj
	public utc: boolean;
	public constructor(options: ConsoleOptions = {}) {
		options = mergeDefault(constants.DEFAULTS.CONSOLE, options);
		super(options.stdout, options.stderr);

		Object.defineProperty(this, 'stdout', { value: options.stdout })

		Object.defineProperty(this, 'stderr', { value: options.stderr })

		Colors.useColors = typeof options.useColor === 'undefined' ? this.stdout.isTTY || false : options.useColor;

		this.colors = {};

		for (const [name, formats] of Object.entries(options.colors)) {
			this.colors[name] = {}
			for (const [type, format] of Object.entries(formats)) this.colors[name][type] = new Colors(format);
		}

		this.utc = options.utc;
	}

	private write(data: any[], type: string = 'log'): void {
		type = type.toLowerCase();
		const newData = data.map(ToolkitConsole._flatten).join('\n');
		const {time, message} = this.colors[type];
		super[constants.DEFAULTS.CONSOLE.types[type] || 'log']
	}

	private static _flatten(data: any): string {
		if (typeof data === 'undefined' || typeof data === 'number' || data === null) return String(data);
		if (typeof data === 'string') return data;
		if (typeof data === 'object') {
			const isArray = Array.isArray(data);
			if (isArray && data.every(datum => typeof datum === 'string')) return data.join('\n');
			return data.stack || data.message || inspect(data, { depth: Number(isArray), colors: Colors.useColors })
		}
		return String(data);
	}
}