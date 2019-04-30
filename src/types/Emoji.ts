import { User } from './User';
import { Base } from './Base';

export interface Emoji extends Base {
    name: string;
    roles?: string[];
    user?: User;
    require_colons: boolean;
    managed: boolean;
    animated: boolean;
}
