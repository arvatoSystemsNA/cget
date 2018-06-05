/// <reference types="node" />
import * as stream from 'stream';
import { Address } from './Address';
import { Headers, InternalHeaders } from './Cache';
import { FetchState } from './FetchState';
export declare const defaultHeaders: {
    'cget-status': number;
    'cget-message': string;
};
export declare class CacheResult {
    stream: stream.Readable;
    private state;
    constructor(stream: stream.Readable, state: FetchState, headers: InternalHeaders);
    retry(err?: any): void;
    abort(err?: any): void;
    address: Address;
    status: number;
    message: string;
    headers: Headers;
}
export interface CustomError extends Error {
    new (message: string): CustomError;
}
export declare const CustomError: CustomError;
export declare class FetchError extends CustomError {
    code: string;
    constructor(code: string, message?: string);
    name: string;
}
export declare class CachedError extends CustomError {
    status: number;
    constructor(status: number, message?: string, headers?: Headers | InternalHeaders);
    headers: Headers;
    name: string;
}
