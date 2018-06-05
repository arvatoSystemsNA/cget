import * as Promise from 'bluebird';
import { InternalHeaders } from '../Cache';
import { FetchState } from '../FetchState';
import { Strategy } from './Strategy';
export declare function openLocal(state: FetchState, path: string, headers: InternalHeaders): Promise<boolean>;
export declare class LocalFetch extends Strategy {
    fetch(state: FetchState): false | Promise<boolean>;
}
