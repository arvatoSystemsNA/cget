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
var Promise = require("bluebird");
var CacheResult_1 = require("../CacheResult");
var Strategy_1 = require("./Strategy");
var statAsync = Promise.promisify(fs.stat, { context: fs });
function openLocal(state, path, headers) {
    var streamIn = fs.createReadStream(path, state.buffer ? { start: state.buffer.len } : {});
    // Resolve promise with headers if stream opens successfully.
    streamIn.on('open', function () {
        // TODO: Should always stream through a buffer...
        if (state.buffer) {
            streamIn.pipe(state.buffer);
        }
        else {
            state.startStream(new CacheResult_1.CacheResult(streamIn, state, headers));
        }
    });
    return (new Promise(function (resolve, reject) {
        // TODO: also emit the error?
        state.onKill = reject;
        // Cached file doesn't exist or IO error.
        streamIn.on('error', reject);
        streamIn.on('end', function () { return resolve(true); });
    }));
}
exports.openLocal = openLocal;
var LocalFetch = /** @class */ (function (_super) {
    __extends(LocalFetch, _super);
    function LocalFetch() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LocalFetch.prototype.fetch = function (state) {
        if (!state.address.isLocal)
            return (false);
        if (!state.allowLocal) {
            throw (new CacheResult_1.FetchError('EPERM', 'Access denied to local ' + state.address.url));
        }
        var path = state.address.path;
        var result = statAsync(path).then(function (stats) { return ({
            'cget-stamp': stats.mtime.getTime(),
            'cget-status': 200,
            'cget-message': 'OK'
        }); }).then(function (headers) { return openLocal(state, path, headers); });
        return (result);
    };
    return LocalFetch;
}(Strategy_1.Strategy));
exports.LocalFetch = LocalFetch;
