"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
function extend(dst, src) {
    for (var _i = 0, _a = Object.keys(src); _i < _a.length; _i++) {
        var key = _a[_i];
        if (src[key] !== void 0) {
            dst[key] = src[key];
        }
    }
    return (dst);
}
exports.extend = extend;
var FetchState = /** @class */ (function () {
    function FetchState(options) {
        if (options === void 0) { options = {}; }
        this.allowLocal = false;
        this.allowRemote = true;
        this.allowCacheRead = true;
        this.allowCacheWrite = true;
        this.rewrite = void 0;
        this.username = void 0;
        this.password = void 0;
        this.timeout = 0;
        this.cwd = '.';
        this.requestConfig = void 0;
        this.retryCount = 0;
        this.retryDelay = 0;
        this.retryBackoffFactor = 1;
        this.strategyNum = 0;
        this.strategyDelay = 0;
        this.isStreaming = false;
        this.setOptions(options);
        if (!this.retryDelay ||
            !this.retryCount ||
            this.retryDelay < 0 ||
            this.retryCount < 0)
            this.retryCount = 0;
        this.retriesRemaining = this.retryCount;
    }
    FetchState.prototype.setOptions = function (options) {
        if (options === void 0) { options = {}; }
        return (extend(this, options));
    };
    FetchState.prototype.extendRequestConfig = function (config) {
        return (extend(config, this.requestConfig || {}));
    };
    FetchState.prototype.clone = function () {
        return (new FetchState(this));
    };
    FetchState.prototype.startStream = function (result) {
        var _this = this;
        var ready = Promise.try(function () { return _this.onStream(result); }).then(function () { _this.isStreaming = true; });
        return (ready);
    };
    FetchState.prototype.abort = function () {
        this.strategyNum = Infinity;
    };
    FetchState.prototype.retryNow = function () {
        this.strategyNum = 0;
    };
    FetchState.prototype.retryLater = function () {
        if (this.retriesRemaining <= 0)
            return;
        --this.retriesRemaining;
        this.strategyNum = 0;
        // Signal cache to delay before retrying.
        this.strategyDelay = this.retryDelay * (1 + Math.random());
        this.retryDelay *= this.retryBackoffFactor;
    };
    return FetchState;
}());
exports.FetchState = FetchState;
