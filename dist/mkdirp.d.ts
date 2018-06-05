import * as Promise from 'bluebird';
/** Promise while loop. */
export declare function repeat<T>(fn: (again: {}) => Promise<T> | T | undefined): Promise<T>;
/** Create a new directory and its parent directories.
  * If a path component to create conflicts with an existing file,
  * rename to file to <component>/<indexName>. */
export declare function mkdirp(pathName: string, indexName: string): Promise<any>;
/** Create a string of random letters and numbers. */
export declare function makeTempSuffix(length: number): string;
