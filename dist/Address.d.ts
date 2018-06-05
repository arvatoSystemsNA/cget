export declare function path2url(localPath: string): string;
export declare function url2path(fileUrl: string): string;
/** Last line of defence to filter malicious paths. */
export declare function sanitizePath(urlPath: string): string;
export declare class Address<RedirectData = any> {
    uri: string;
    cacheKey?: string | undefined;
    constructor(uri: string, baseUrl?: string, cacheKey?: string | undefined);
    redirect(url: string, isFake?: boolean, data?: RedirectData): this;
    private setKey;
    urn: string | undefined;
    url: string;
    history: {
        url: string;
        path?: string;
        data?: RedirectData;
    }[];
    path: string;
    /** Address was redirected from a local file. */
    wasLocal: boolean;
    /** Address was redirected from a remote address. */
    wasRemote: boolean;
    /** Address refers to a local file. */
    isLocal: boolean;
    /** Address refers to a remote address. */
    isRemote: boolean;
}
