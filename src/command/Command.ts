import { ToolkitClient as Client } from '../client/ToolkitClient';
import { ArgOpts } from '../types';
import { PermissionResolvable } from 'discord.js';

export abstract class Command<T extends Client = Client> {
    private _disabled!: boolean;
    private _ratelimit!: string;

    public client!: T
    public name!: string
    public desc!: string;
    public usage!: string;
    public info!: string;
    public group!: string;
    public aliases!: string[]
    public guildOnly!: boolean;
    public hidden!: boolean;
    public argOpts!: ArgOpts;
    public callerPermissions!: PermissionResolvable[]
    public clientPermissions!: PermissionResolvable[]
    public roles!: string[];
    public ownerOnly!: boolean;
    public external!: boolean;
    public lockTimeout!: number;

    public _classloc!: string;
    public _initialized: boolean;

    public _register(client: T): void {
        this.client = client;
        if (typeof this.aliases === 'undefined') this.aliases = [];
        if (typeof this.group === 'undefined') this.group = 'base';
        if (typeof this.guildOnly === 'undefined') this.guildOnly = false;
        if (typeof this.hidden === 'undefined') this.hidden = false;
        if (typeof this.argOpts === 'undefined') this.argOpts = {};
        if (typeof this.argOpts.separator === 'undefined') this.argOpts.separator = ' ';
        if (typeof this.callerPermissions === 'undefined') this.callerPermissions = [];
        if (typeof this.clientPermissions === 'undefined') this.clientPermissions = [];
        if (typeof this.roles === 'undefined') this.roles = [];
        if (typeof this.ownerOnly === 'undefined') this.ownerOnly = false;
        if (typeof this.external === 'undefined') this.external = false;
        if (typeof this._disabled === 'undefined') this._disabled = false;
        if (typeof this._classloc === 'undefined') this._classloc = '<External Command>';
        if (typeof this.lockTimeout === 'undefined') this.lockTimeout = 30e3;
    }
}
