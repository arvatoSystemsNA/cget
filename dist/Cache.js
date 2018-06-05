"use strict";
// This file is part of cget, copyright (c) 2015-2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var cwait_1 = require("cwait");
var index_1 = require("./strategy/index");
var mkdirp_1 = require("./mkdirp");
var Address_1 = require("./Address");
var FetchState_1 = require("./FetchState");
var CacheResult_1 = require("./CacheResult");
;
;
var Cache = /** @class */ (function () {
    function Cache(basePath, options) {
        if (options === void 0) { options = {}; }
        this.fetchPipeline = [];
        this.storePipeline = [];
        var fileSystemCache = new index_1.FileSystemCache(this, basePath || 'cache', options);
        this.fetchPipeline.push(new index_1.LocalFetch(this, options));
        this.fetchPipeline.push(fileSystemCache);
        this.fetchPipeline.push(new index_1.RemoteFetch(this, options));
        this.storePipeline.push(fileSystemCache);
        this.fetchQueue = new cwait_1.TaskQueue(Promise, options.concurrency || 2);
        this.defaultState = new FetchState_1.FetchState(options);
    }
    /** Fetch URL from cache or download it if not available yet.
      * @return URL of fetched file after redirections
      * and a readable stream of its contents. */
    Cache.prototype.fetch = function (uri, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return (new Promise(function (opened, errored) {
            var state = _this.defaultState.clone().setOptions(options);
            state.address = new Address_1.Address(uri, Address_1.path2url(state.cwd) + '/', options.cacheKey);
            state.onStream = opened;
            state.errored = errored;
            _this.fetchDetect(state);
        }));
    };
    Cache.prototype.fetchDetect = function (state, delay) {
        var _this = this;
        if (delay === void 0) { delay = 0; }
        var pipeline = this.fetchPipeline;
        var errLatest;
        this.fetchQueue.add(function () { return mkdirp_1.repeat(function (again) {
            return Promise.try(function () { return pipeline[state.strategyNum++].fetch(state); }).catch(function (err) {
                errLatest = err;
                return (false);
            }).then(function (success) {
                if (success)
                    return;
                if (state.strategyNum >= pipeline.length || errLatest instanceof CacheResult_1.CachedError) {
                    state.errored(errLatest || new Error('Unable to handle URI ' + state.address.uri));
                }
                else if (state.strategyDelay) {
                    _this.fetchDetect(state, state.strategyDelay);
                }
                else {
                    return (again);
                }
            });
        }); }, delay);
    };
    /** Store custom data related to a URL-like address,
      * for example an XML namespace.
      * @return Promise resolving to path of cached file after all data is written. */
    Cache.prototype.store = function (uri, data, headers) {
        var address = uri instanceof Address_1.Address ? uri : new Address_1.Address(uri);
        var pipeline = this.storePipeline;
        var strategyNum = 0;
        var result = mkdirp_1.repeat(function (again) {
            return Promise.try(function () { return pipeline[strategyNum++].store(address, data, headers); }).then(function (success) { return success || again; });
        });
        return (result);
    };
    return Cache;
}());
exports.Cache = Cache;
