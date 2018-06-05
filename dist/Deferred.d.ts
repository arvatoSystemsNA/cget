import * as Promise from 'bluebird';
export declare class Deferred<Type> {
    constructor();
    promise: Promise<Type>;
    resolve: (result?: Type | Promise<Type>) => void;
    reject: (err?: any) => void;
}
