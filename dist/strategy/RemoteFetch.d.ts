import * as Promise from 'bluebird';
import { Address } from '../Address';
import { InternalHeaders } from '../Cache';
import { FetchState } from '../FetchState';
import { Strategy } from './Strategy';
export declare class RemoteFetch extends Strategy {
    fetch(state: FetchState): false | Promise<boolean>;
    /** Store HTTP redirect headers with the final target address. */
    addLinks(address: Address<InternalHeaders>): Promise<{}[]>;
}
