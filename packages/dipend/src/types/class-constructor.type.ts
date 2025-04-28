export type TClassConstructor = (new (...args: Array<any>) => any) & Record<symbol | string, any>;
