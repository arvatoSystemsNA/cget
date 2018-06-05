/// <reference types="node" />
import * as stream from 'stream';
import * as Promise from 'bluebird';
import { Address } from '../Address';
import { Cache, CacheOptions, InternalHeaders } from '../Cache';
import { FetchState } from '../FetchState';
export declare abstract class Strategy {
    cache: Cache;
    options: CacheOptions;
    constructor(cache: Cache, options: CacheOptions);
    /** @return Success flag. */
    abstract fetch(state: FetchState): boolean | Promise<boolean>;
    store?(address: Address, data?: string | stream.Readable, headers?: InternalHeaders): boolean | Promise<boolean>;
}
