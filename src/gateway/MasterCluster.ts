import cp = require('child_process');
import path = require('path');
import { EventEmitter } from 'events';
import { Gateway } from './Gateway';

export class ChildCluster extends EventEmitter {
    public gateway: Gateway;

    public constructor(token: string) {
        super();
        this.gateway = Gateway.fetch(token);
    }
}
