/// <reference types="node" />
import * as Promise from 'bluebird';
import * as request from 'request';
import { FetchOptions, InternalHeaders } from './Cache';
import { BufferStream } from './BufferStream';
import { CacheResult, CachedError } from './CacheResult';
import { Address } from './Address';
export declare function extend<Type>(dst: Type, src: {
    [key: string]: any;
}): Type;
export declare class FetchState implements FetchOptions {
    constructor(options?: FetchOptions);
    setOptions(options?: FetchOptions): this;
    extendRequestConfig(config: request.CoreOptions): request.CoreOptions;
    clone(): FetchState;
    startStream(result: CacheResult): Promise<void>;
    abort(): void;
    retryNow(): void;
    retryLater(): void;
    allowLocal: boolean;
    allowRemote: boolean;
    allowCacheRead: boolean;
    allowCacheWrite: boolean;
    rewrite?: (url: string) => string;
    username?: string;
    password?: string;
    timeout: number;
    cwd: string;
    requestConfig?: request.CoreOptions;
    retryCount: number;
    retryDelay: number;
    retryBackoffFactor: number;
    retriesRemaining: number;
    strategyNum: number;
    strategyDelay: number;
    isStreaming: boolean;
    address: Address<InternalHeaders>;
    onKill: (err?: any) => void;
    onStream: (result: CacheResult) => void;
    errored: (err: CachedError | NodeJS.ErrnoException) => void;
    buffer?: BufferStream;
}
