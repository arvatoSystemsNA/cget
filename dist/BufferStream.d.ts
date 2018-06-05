/// <reference types="node" />
import * as stream from 'stream';
export declare class BufferStream extends stream.Transform {
    _transform(chunk: Buffer, encoding: string, flush: (err: NodeJS.ErrnoException | null, chunk: Buffer) => void): void;
    len: number;
}
