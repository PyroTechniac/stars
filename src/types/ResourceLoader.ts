import { TemplateData } from './TemplateData';

export type ResourceLoader = (key: string, data?: TemplateData) => string;
