/// <reference types="node" />
import * as stream from 'stream';
import * as Promise from 'bluebird';
import { Address } from '../Address';
import { Cache, CacheOptions, InternalHeaders } from '../Cache';
import { FetchState } from '../FetchState';
import { Strategy } from './Strategy';
export interface RedirectResult {
    address: Address<InternalHeaders>;
    cachePath: string;
    headers: InternalHeaders;
}
export declare function pathIsDir(cachePath: string): Promise<boolean>;
/** Get path to headers for a locally cached file. */
export declare function getHeaderPath(cachePath: string, address: Address): string;
export declare function getHeaders(cachePath: string, address: Address): Promise<any>;
export declare class FileSystemCache extends Strategy {
    constructor(cache: Cache, basePath: string, options: CacheOptions);
    /** Try to synchronously guess the cache path for an address.
      * May be incorrect if it's a directory. */
    getCachePathSync(urlPath: string): string;
    /** Get local cache file path where a remote URL should be downloaded. */
    getCachePath(urlPath: string): Promise<string>;
    /** Like getCachePath, but create its parent directory if nonexistent. */
    private createCachePath;
    /** Test if an address is cached. */
    isCached(uri: string): false | Promise<boolean>;
    store(address: Address, data?: string | stream.Readable, headers?: InternalHeaders): Promise<boolean>;
    /** Check if there are cached headers with errors or redirecting the URL. */
    getRedirect(address: Address): Promise<RedirectResult>;
    fetch(state: FetchState): false | Promise<boolean>;
    private basePath;
    private indexName;
}
