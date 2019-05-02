import { encode } from '../util';
import * as amqp from 'amqplib';
import { ulid } from 'ulid';
const {isFatalError} = require('amqplib/lib/connection'); // eslint-disable-line
import { Broker } from './Base';

export interface AmqpOptions {
    reconnectTimeout?: number;
    consume?: amqp.Options.Consume;
    assert?: amqp.Options.AssertQueue;
}

export class Amqp<Send = any, Receive = any> extends Broker<Send, Receive> {
    public channel?: amqp.Channel = undefined;

    public callback?: string;

    public group: string = '';

    public subgroup: string = '';

    public options: AmqpOptions;

    private _consumers: {[event: string]: string} = {};

    public constructor(group: string, options?: AmqpOptions);
    public constructor(group: string, subgroup: string, options?: AmqpOptions)
    public constructor(group: string = 'default', subgroup?: AmqpOptions | string, options: AmqpOptions = {}) {
        super();
        this.group = group;

        if (typeof subgroup === 'object') options = subgroup;
        else if (typeof subgroup === 'string') this.subgroup = subgroup;

        this.options = options;
    }

    public async connect(urlOrConn: string | amqp.Connection, options?: any): Promise<amqp.Connection> {
        let connection: amqp.Connection | undefined;
        if (typeof urlOrConn !== 'string') connection = urlOrConn;

        while (!connection) {
            try {
                connection = await amqp.connect(`amqp://${urlOrConn}`, options);
            } catch (e) {
                this.emit('close', e);
                await new Promise(r => setTimeout(r, this.options.reconnectTimeout));
                continue;
            }
        }
    }
}
