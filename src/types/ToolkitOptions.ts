import { LogLevel } from './LogLevel';

export interface ToolkitOptions {
    token?: string;
    owner?: string | string[];
    commandsDir?: string;
    eventsDir?: string;
    localeDir?: string;
    defaultLang?: string;
    statusText?: string;
    readyText?: string;
    unknownCommandError?: boolean;
    dmHelp?: boolean;
    passive?: boolean;
    pause?: boolean;
    ratelimit?: string;
    logLevel?: LogLevel;
    buttons?: { [key: string]: string };
    compact?: boolean;
    tsNode?: boolean;
}
