export interface ConsoleStyleTypes {
	normal: string;
	bold: string;
	dim: string;
	italic: string;
	underline: string;
	inverse: string;
	hidden: string;
	strikethrough: string;
}

export interface ConsoleColorTypes {
	black: string;
	red: string;
	green: string;
	yellow: string;
	blue: string;
	magenta: string;
	cyan: string;
	gray: string;
	grey: string;
	lightgrey: string;
	lightgray: string;
	lightred: string;
	lightgreen: string;
	lightyellow: string;
	lightblue: string;
	lightmagenta: string;
	lightcyan: string;
	white: string
}

export interface ConsoleTimeObject {
	background: ConsoleColorTypes;
	text: ConsoleColorTypes;
	style: ConsoleStyleTypes;
}

export interface ConsoleMessageObject {
	background: ConsoleColorTypes;
	text: ConsoleColorTypes;
	style: ConsoleStyleTypes;
}

export interface ConsoleColorObjects {
	type?: string;
	message: ConsoleMessageObject;
	time: ConsoleTimeObject;
}

export interface ConsoleColorStyles {
	debug: ConsoleColorObjects;
	error: ConsoleColorObjects;
	log: ConsoleColorObjects;
	verbose: ConsoleColorObjects;
	warn: ConsoleColorObjects;
	wtf: ConsoleColorObjects;
}

export interface ConsoleOptions {
	colors?: ConsoleColorStyles;
	stdout?: NodeJS.WritableStream;
	stderr?: NodeJS.WritableStream
	timestamps?: boolean | string;
	useColor?: boolean;
	utc?: boolean;
}