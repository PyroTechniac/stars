import 'reflect-metadata';
import * as Discord from 'discord.js';
import * as path from 'path';

import { console, Console } from '../util/console/Console';
import { ListenerUtil } from '../util/ListenerUtil';
import { ToolkitOptions } from '../types';
import { ClientUtil } from './ClientUtil';
import { ToolkitConsole } from '../util/ToolkitConsole';

const { once, on, registerListeners } = ListenerUtil;

export class ToolkitClient extends Discord.Client {
    public console: ToolkitConsole = new ToolkitConsole();
    private readonly _token: string;
    private _ratelimit!: string;

    public readonly compact: boolean;
    public readonly tsNode: boolean
    public readonly util: ClientUtil = new ClientUtil(this);

    public constructor(options: ToolkitOptions, clientOptions?: Discord.ClientOptions) {
        super(clientOptions);
        Reflect.defineMetadata('ToolkitClient', true, this);
    }
}
