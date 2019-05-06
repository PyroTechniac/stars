import { TemplateData } from './TemplateData';
import { BaseStrings } from '../localization/BaseStrings';

export type ResourceProxy<T = {}> = {
    [key in BaseStrings]: (data?: TemplateData) => string
} & {
    [key in keyof T]: (data?: TemplateData) => string;
}
