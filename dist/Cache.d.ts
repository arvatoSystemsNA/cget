/// <reference types="node" />
import * as stream from 'stream';
import * as request from 'request';
import * as Promise from 'bluebird';
import { Strategy } from './strategy/index';
import { Address } from './Address';
import { CacheResult } from './CacheResult';
export interface FetchOptions {
    allowLocal?: boolean;
    allowRemote?: boolean;
    allowCacheRead?: boolean;
    allowCacheWrite?: boolean;
    rewrite?: (url: string) => string;
    username?: string | null;
    password?: string | null;
    timeout?: number;
    cwd?: string;
    cacheKey?: string;
    requestConfig?: request.CoreOptions;
    retryCount?: number;
    /** Backoff time between retries, in milliseconds. */
    retryDelay?: number;
    /** Base for exponential backoff. */
    retryBackoffFactor?: number;
}
export interface CacheOptions extends FetchOptions {
    indexName?: string;
    concurrency?: number;
}
export interface InternalHeaders {
    [key: string]: number | string | string[] | undefined;
    'cget-stamp'?: number;
    'cget-status'?: number;
    'cget-message'?: string;
    'cget-target'?: string;
}
export interface Headers {
    [key: string]: string | string[] | undefined;
}
export declare class Cache {
    constructor(basePath?: string, options?: CacheOptions);
    /** Fetch URL from cache or download it if not available yet.
      * @return URL of fetched file after redirections
      * and a readable stream of its contents. */
    fetch(uri: string, options?: FetchOptions): Promise<CacheResult>;
    private fetchDetect;
    /** Store custom data related to a URL-like address,
      * for example an XML namespace.
      * @return Promise resolving to path of cached file after all data is written. */
    store(uri: string | Address, data?: string | stream.Readable, headers?: InternalHeaders): Promise<{}>;
    /** Queue for limiting parallel downloads. */
    private fetchQueue;
    fetchPipeline: Strategy[];
    storePipeline: Strategy[];
    private defaultState;
}
