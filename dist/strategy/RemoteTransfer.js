"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stream = require("stream");
var request = require("request");
var Deferred_1 = require("../Deferred");
var BufferStream_1 = require("../BufferStream");
var CacheResult_1 = require("../CacheResult");
var FetchState_1 = require("../FetchState");
var retryCodeTbl = {};
for (var _i = 0, _a = ('EAI_AGAIN ECONNREFUSED ECONNRESET EHOSTUNREACH' +
    ' ENOTFOUND EPIPE ESOCKETTIMEDOUT ETIMEDOUT').split(' '); _i < _a.length; _i++) {
    var code = _a[_i];
    retryCodeTbl[code] = true;
}
function applyRewrite(url, options) {
    return (options.rewrite ? options.rewrite(url) : url);
}
var RemoteTransfer = /** @class */ (function () {
    function RemoteTransfer(strategy, state) {
        var _this = this;
        this.strategy = strategy;
        this.state = state;
        this.onData = function (chunk) { _this.chunkList.push(chunk); };
        this.onEnd = function () { _this.isEnded = true; };
        this.deferred = new Deferred_1.Deferred();
        this.ready = this.deferred.promise;
        this.chunkList = [];
        this.errorList = [];
        this.isEnded = false;
        this.streamRequest = this.initRequest(state.address.url);
        this.start();
    }
    RemoteTransfer.prototype.initRequest = function (url) {
        var _this = this;
        var state = this.state;
        var config = state.extendRequestConfig({
            // Receive raw byte buffers.
            encoding: null,
            gzip: true,
            followRedirect: function (res) { return _this.followRedirect(res); },
            pool: {
                maxSockets: Infinity
            }
        });
        if (state.timeout)
            config.timeout = state.timeout;
        if (state.username && state.password) {
            config.auth = {
                user: state.username,
                pass: state.password,
                sendImmediately: true
            };
        }
        var stream = request.get(applyRewrite(url, state), config);
        return (stream);
    };
    RemoteTransfer.prototype.followRedirect = function (res) {
        var headers = {};
        FetchState_1.extend(headers, res.headers);
        FetchState_1.extend(headers, {
            'cget-stamp': new Date().getTime(),
            'cget-status': res.statusCode,
            'cget-message': res.statusMessage
        });
        this.state.address.redirect('' + headers.location, false, headers);
        this.state.retryNow();
        this.deferred.resolve(false);
        return (false);
    };
    RemoteTransfer.prototype.start = function () {
        var _this = this;
        var streamRequest = this.streamRequest;
        streamRequest.on('data', function (chunk) { return _this.onData(chunk); });
        streamRequest.on('end', function () { return _this.onEnd(); });
        streamRequest.on('error', function (err) {
            // Check if retrying makes sense for this error.
            if (retryCodeTbl[err.code || '']) {
                _this.retry(err);
            }
            else {
                _this.die(err);
            }
        });
        streamRequest.on('response', function (res) { return _this.onResponse(res); });
    };
    RemoteTransfer.prototype.retry = function (err) {
        this.state.retryLater();
        this.deferred.reject(err);
    };
    RemoteTransfer.prototype.die = function (err) {
        // Only emit error in output stream after open callback
        // had a chance to attach an error handler.
        if (this.state.isStreaming) {
            // TODO: call destroy method instead?
            this.streamBuffer.emit('error', err);
        }
        else {
            this.errorList.push(err);
        }
        this.deferred.reject(err);
    };
    RemoteTransfer.prototype.onResponse = function (res) {
        var _this = this;
        var state = this.state;
        var status = res.statusCode;
        var headers = {};
        FetchState_1.extend(headers, res.headers);
        FetchState_1.extend(headers, {
            'cget-stamp': new Date().getTime(),
            'cget-status': status,
            'cget-message': res.statusMessage
        });
        if (status >= 500 && status < 600) {
            this.retry();
            return;
        }
        else if (status != 200) {
            var err = new CacheResult_1.CachedError(status, res.statusMessage, headers);
            if (state.allowCacheWrite) {
                this.strategy.cache.store(this.state.address, void 0, headers).catch(function () { });
            }
            this.die(err);
            return;
        }
        if (state.allowCacheWrite) {
            this.streamStore = new stream.PassThrough();
            this.strategy.cache.store(this.state.address, this.streamStore, headers).catch(function () { });
            if (!this.state.address.cacheKey)
                this.strategy.addLinks(this.state.address);
        }
        // TODO: call this.die instead?
        state.onKill = function (err) { return _this.deferred.reject(err); };
        if (!state.buffer)
            state.buffer = new BufferStream_1.BufferStream();
        this.streamBuffer = state.buffer;
        this.streamBuffer.on('error', function (err) {
            _this.streamRequest.abort();
            _this.state.isStreaming = false;
            _this.die(err);
        });
        this.streamBuffer.on('finish', function () { _this.deferred.resolve(true); });
        state.startStream(new CacheResult_1.CacheResult(this.streamBuffer, state, res.headers)).then(function () {
            // Start emitting data straight to output streams.
            _this.onData = function (chunk) {
                if (_this.streamStore)
                    _this.streamStore.write(chunk);
                _this.streamBuffer.write(chunk);
            };
            _this.onEnd = function () {
                if (_this.streamStore)
                    _this.streamStore.end();
                _this.streamBuffer.end();
            };
            // Output data chunks already arrived in memory buffer.
            for (var _i = 0, _a = _this.chunkList; _i < _a.length; _i++) {
                var chunk = _a[_i];
                _this.onData(chunk);
            }
            // Emit any errors already encountered.
            // TODO: Also call destroy method?
            for (var _b = 0, _c = _this.errorList; _b < _c.length; _b++) {
                var err_1 = _c[_b];
                _this.streamBuffer.emit('error', err_1);
            }
            if (_this.isEnded)
                _this.onEnd();
            // Clear buffers to save memory.
            _this.chunkList = [];
            _this.errorList = [];
        });
    };
    return RemoteTransfer;
}());
exports.RemoteTransfer = RemoteTransfer;
