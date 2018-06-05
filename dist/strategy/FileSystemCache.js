"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var mkdirp_1 = require("../mkdirp");
var Address_1 = require("../Address");
var CacheResult_1 = require("../CacheResult");
var Strategy_1 = require("./Strategy");
var LocalFetch_1 = require("./LocalFetch");
var statAsync = Promise.promisify(fs.stat, { context: fs });
var readFileAsync = Promise.promisify(fs.readFile, { context: fs });
var writeFileAsync = Promise.promisify(fs.writeFile, { context: fs });
function pathIsDir(cachePath) {
    return (statAsync(cachePath).then(function (stats) { return stats.isDirectory(); }).catch(function (err) { return false; }));
}
exports.pathIsDir = pathIsDir;
/** Get path to headers for a locally cached file. */
function getHeaderPath(cachePath, address) {
    return (cachePath + '.header.json');
}
exports.getHeaderPath = getHeaderPath;
function getHeaders(cachePath, address) {
    return (readFileAsync(getHeaderPath(cachePath, address), { encoding: 'utf8' }).then(JSON.parse).catch(
    /** If headers are not found, invent some. */
    function (err) { return CacheResult_1.defaultHeaders; }));
}
exports.getHeaders = getHeaders;
var FileSystemCache = /** @class */ (function (_super) {
    __extends(FileSystemCache, _super);
    function FileSystemCache(cache, basePath, options) {
        var _this = _super.call(this, cache, options) || this;
        _this.basePath = path.resolve('.', basePath);
        _this.indexName = options.indexName || 'index.html';
        return _this;
    }
    /** Try to synchronously guess the cache path for an address.
      * May be incorrect if it's a directory. */
    FileSystemCache.prototype.getCachePathSync = function (urlPath) {
        return (path.join(this.basePath, urlPath));
    };
    /** Get local cache file path where a remote URL should be downloaded. */
    FileSystemCache.prototype.getCachePath = function (urlPath) {
        var indexName = this.indexName;
        var cachePath = this.getCachePathSync(urlPath);
        function makeValidPath(isDir) {
            if (isDir)
                cachePath = path.join(cachePath, indexName);
            return (cachePath);
        }
        ;
        if (cachePath.charAt(cachePath.length - 1) == path.sep) {
            return (Promise.resolve(makeValidPath(true)));
        }
        return (pathIsDir(cachePath).then(makeValidPath));
    };
    /** Like getCachePath, but create its parent directory if nonexistent. */
    FileSystemCache.prototype.createCachePath = function (urlPath) {
        var _this = this;
        return (this.getCachePath(urlPath).then(function (cachePath) {
            return mkdirp_1.mkdirp(path.dirname(cachePath), _this.indexName).then(function () { return cachePath; });
        }));
    };
    /** Test if an address is cached. */
    FileSystemCache.prototype.isCached = function (uri) {
        var address = new Address_1.Address(uri);
        if (!address.path)
            return (false);
        return (this.getCachePath(address.path).then(function (cachePath) {
            return statAsync(cachePath).then(function (stats) { return !stats.isDirectory(); }).catch(function (err) { return false; });
        }));
    };
    FileSystemCache.prototype.store = function (address, data, headers) {
        if (address.isLocal)
            return (Promise.reject(new Error('URI to cache is a local path')));
        var taskList = [];
        if (data) {
            taskList.push(this.createCachePath(address.path).then(function (cachePath) {
                if (typeof (data) == 'string') {
                    return (writeFileAsync(cachePath, data, { encoding: 'utf8' }));
                }
                else {
                    return (new Promise(function (resolve, reject) {
                        var stream = fs.createWriteStream(cachePath);
                        // Output stream file handle stays open unless manually closed.
                        stream.on('finish', function () {
                            stream.close();
                            resolve();
                        });
                        stream.on('error', function (err) {
                            stream.close();
                            reject(err);
                        });
                        data.pipe(stream);
                    }));
                }
            }));
        }
        if (headers) {
            taskList.push(this.createCachePath(address.path).then(function (cachePath) {
                return (writeFileAsync(getHeaderPath(cachePath, address), JSON.stringify(headers), { encoding: 'utf8' }));
            }));
        }
        return (Promise.all(taskList).then(function () { return true; }));
    };
    /** Check if there are cached headers with errors or redirecting the URL. */
    FileSystemCache.prototype.getRedirect = function (address) {
        var _this = this;
        var result = this.getCachePath(address.path).then(function (cachePath) { return getHeaders(cachePath, address).then(function (headers) {
            var status = +(headers['cget-status'] || 0);
            var target = headers['cget-target'] || '' + headers['location'];
            if (status && status >= 300 && status <= 308 && target) {
                return (_this.getRedirect(address.redirect(target)));
            }
            if (status && status != 200 && (status < 500 || status >= 600)) {
                throw (new CacheResult_1.CachedError(status, headers['cget-message'], headers));
            }
            var result = { address: address, cachePath: cachePath, headers: headers };
            return (result);
        }); });
        return (result);
    };
    FileSystemCache.prototype.fetch = function (state) {
        if (!state.address.isRemote || !state.allowCacheRead)
            return (false);
        return (this.getRedirect(state.address).then(function (result) { return LocalFetch_1.openLocal(state, result.cachePath, result.headers); }));
    };
    return FileSystemCache;
}(Strategy_1.Strategy));
exports.FileSystemCache = FileSystemCache;
