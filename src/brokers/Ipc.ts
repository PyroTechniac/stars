import { Broker } from './Base';
import { ChildProcess, fork, ForkOptions } from 'child_process';
import { ulid } from 'ulid';

export interface IpcMessage {
	event: string;
	data: any;
	key?: string;
}

export class Ipc<Send = any, Receive = any> extends Broker<Send, Receive> {
	public children: ChildProcess[] = []
	private _nextChildIndex = 0;
	private _messageHandler = (message: IpcMessage) => {
		this._handleMessage(message.event, message.data).then(res => {
			if (res) return this._send({ event: message.event, data: res, key: message.key })
		}, err => this.emit('error', err))
	}

	public constructor() {
		super();
		process.on('message', this._messageHandler);
	}

	public fork(proc: ChildProcess): void
	public fork(dir: string, args?: ReadonlyArray<string>, options?: ForkOptions): void
	public fork(dir: string | ChildProcess, args?: ReadonlyArray<string>, options?: ForkOptions): void {
		const child = typeof dir === 'string' ? fork(dir, args, options) : dir;
		child.on('message', this._messageHandler);
		this.children.push(child);
	}
}