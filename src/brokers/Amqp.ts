import { encode } from '../util';
import * as amqp from 'amqplib';
import { ulid } from 'ulid';
const { isFatalError } = require('amqplib/lib/connection'); // eslint-disable-line
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

    private _consumers: { [event: string]: string } = {};

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
            connection.on('close', (err) => {
                if (!isFatalError(err)) {
                    this.emit('close', err);
                    setTimeout(() => this.connect(urlOrConn, options), this.options.reconnectTimeout)
                }
            })

            connection.on('error', (err) => {
                this.emit('error', err);
            })
        }

        this.channel = await connection.createChannel()

        this.callback = (await this.channel.assertQueue('', { exclusive: true })).queue;

        this.channel.consume(this.callback, (msg) => {
            if (msg) this._handleMessage(msg.properties.correlationId, msg.content);
        }, {noAck: true})

        await this.channel.assertExchange(this.group ,'direct')
        return connection;
    }

    protected async _subscribe(events: string[]): Promise<amqp.Replies.Consume[]> {
        return Promise.all(events.map(async event => {
            // setup queue
            const queue = `${this.group}:${(this.subgroup && `${this.subgroup}:`) + event}`;
            await this._channel.assertQueue(queue, this.options.assert);
            await this._channel.bindQueue(queue, this.group, event);
      
            // register consumer
            const consumer = await this._channel.consume(queue, async msg => {
              // emit consumed messages with an acknowledger function
              if (msg) {
                try {
                  this._channel.ack(msg);
                  const res = await this._handleMessage(event, msg.content);
                  if (res) this._channel.sendToQueue(msg.properties.replyTo, res, { correlationId: msg.properties.correlationId });
                } catch (e) {
                  this._channel.reject(msg, false);
                  this.emit('error', e);
                }
              }
            }, this.options.consume);
      
            this._consumers[event] = consumer.consumerTag;
            return consumer;
          }));
    }

    protected async _unsubscribe(events: string[]): Promise<boolean[]> {
        return Promise.all(events.map(async event => {
            if (this._consumers[event]) {
                await this._channel.cancel(this._consumers[event]);
                delete this._consumers[event];
                return true
            }
            return false;
        }))
    }

    public publish(event: string, data: Send, options: amqp.Options.Publish = {}): void {
        this._channel.publish(this.group, event, encode(data), options);
    }

    public call(method: string, data: Send, options: amqp.Options.Publish = {}): Promise<Receive> {
        const correlation = ulid();
        this.publish(method, data, Object.assign(options, {
            replyTo: this.callback,
            correlationId: correlation
        }))

        return this._awaitResponse(correlation, typeof options.expiration === 'string' ? parseInt(options.expiration, 10) : options.expiration)
    }

    protected get _channel(): amqp.Channel {
        if (!this.channel) throw new Error('No available AMQP channel');
        return this.channel;
    }
}