import { TransportFunction } from './TransportFunction';
import { LogLevel } from './LogLevel';

export interface Transport {
    transport: TransportFunction;
    level?: LogLevel | (() => LogLevel);
}
