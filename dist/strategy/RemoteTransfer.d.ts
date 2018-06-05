/// <reference types="node" />
import * as http from 'http';
import * as stream from 'stream';
import * as Promise from 'bluebird';
import * as request from 'request';
import { Deferred } from '../Deferred';
import { BufferStream } from '../BufferStream';
import { CachedError } from '../CacheResult';
import { FetchState } from '../FetchState';
import { RemoteFetch } from './RemoteFetch';
export declare class RemoteTransfer {
    strategy: RemoteFetch;
    state: FetchState;
    constructor(strategy: RemoteFetch, state: FetchState);
    initRequest(url: string): request.Request;
    followRedirect(res: http.IncomingMessage): boolean;
    start(): void;
    retry(err?: NodeJS.ErrnoException): void;
    die(err: CachedError | NodeJS.ErrnoException): void;
    onData: (chunk: Buffer) => void;
    onEnd: () => void;
    onResponse(res: http.IncomingMessage): void;
    deferred: Deferred<boolean>;
    ready: Promise<boolean>;
    streamBuffer: BufferStream;
    streamRequest: request.Request;
    streamStore: stream.PassThrough;
    chunkList: Buffer[];
    errorList: (NodeJS.ErrnoException | CachedError)[];
    isEnded: boolean;
}
