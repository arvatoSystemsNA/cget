"use strict";
// This file is part of cget, copyright (c) 2015-2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var URL = require("url");
function path2url(localPath) {
    // Make path absolute, ensure separators are slashes and escape any strange characters.
    var result = path.resolve(localPath).split(path.sep).map(encodeURIComponent).join('/');
    var prefix = 'file://';
    // Absolute paths start with a drive letter on Windows,
    // requiring an extra prefix slash.
    if (result.charAt(0) != '/')
        prefix += '/';
    return (prefix + result);
}
exports.path2url = path2url;
function url2path(fileUrl) {
    var match = fileUrl.match(/file:\/\/(.*)/i);
    // TODO: Remove one more slash if url starts with a drive letter!
    if (!match)
        throw (new Error('Not a file URL: ' + fileUrl));
    return (match[1].split('/').map(decodeURIComponent).join(path.sep));
}
exports.url2path = url2path;
/** Last line of defence to filter malicious paths. */
function sanitizePath(urlPath) {
    return (urlPath
        // Remove unwanted characters.
        .replace(/[^-_./0-9A-Za-z]/g, '_')
        // Remove - _ . / from beginnings of path parts.
        .replace(/(^|\/)[-_./]+/g, '$1')
        // Remove - _ . / from endings of path parts.
        .replace(/[-_./]+($|\/)/g, '$1'));
}
exports.sanitizePath = sanitizePath;
var Address = /** @class */ (function () {
    function Address(uri, baseUrl, cacheKey) {
        this.uri = uri;
        this.cacheKey = cacheKey;
        this.history = [];
        /** Address was redirected from a local file. */
        this.wasLocal = false;
        /** Address was redirected from a remote address. */
        this.wasRemote = false;
        /** Address refers to a local file. */
        this.isLocal = false;
        /** Address refers to a remote address. */
        this.isRemote = false;
        this.url = baseUrl || path2url('.');
        if (uri.match(/^urn:/i)) {
            this.urn = uri;
            this.cacheKey = this.urn.substr(4).replace(/:/g, '/');
        }
        else {
            this.redirect(uri, true);
        }
        if (this.cacheKey)
            this.setKey(this.cacheKey);
    }
    Address.prototype.redirect = function (url, isFake, data) {
        if (isFake === void 0) { isFake = false; }
        if (!isFake)
            this.history.push({ url: this.url, path: this.path, data: data });
        url = URL.resolve(this.url, url);
        this.url = url;
        this.wasLocal = this.wasLocal || this.isLocal;
        this.wasRemote = this.wasRemote || this.isRemote;
        if (url.match(/^file:/i)) {
            this.isLocal = true;
            this.isRemote = false;
            this.path = url2path(url);
        }
        else {
            this.isLocal = false;
            this.isRemote = true;
            if (!this.cacheKey) {
                var parts = URL.parse(url, false, true);
                var origin = (parts.host || '').replace(/:.*/, '');
                this.setKey((parts.protocol + origin + '/' + parts.pathname + (parts.search || '')).split(/[/:?]/).map(decodeURIComponent).join('/'));
            }
        }
        return (this);
    };
    Address.prototype.setKey = function (cacheKey) {
        this.path = sanitizePath(cacheKey).replace(/\//g, path.sep);
    };
    return Address;
}());
exports.Address = Address;
