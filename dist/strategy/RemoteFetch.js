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
var Promise = require("bluebird");
var CacheResult_1 = require("../CacheResult");
var Strategy_1 = require("./Strategy");
var RemoteTransfer_1 = require("./RemoteTransfer");
var RemoteFetch = /** @class */ (function (_super) {
    __extends(RemoteFetch, _super);
    function RemoteFetch() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RemoteFetch.prototype.fetch = function (state) {
        if (!state.address.isRemote)
            return (false);
        if (!state.allowRemote) {
            throw (new CacheResult_1.FetchError('EPERM', 'Access denied to remote address ' + state.address.url));
        }
        return (new RemoteTransfer_1.RemoteTransfer(this, state).ready);
    };
    /** Store HTTP redirect headers with the final target address. */
    RemoteFetch.prototype.addLinks = function (address) {
        var _this = this;
        return (Promise.map(address.history, function (_a) {
            var url = _a.url, path = _a.path, data = _a.data;
            return _this.cache.store(url, void 0, data);
        }));
    };
    return RemoteFetch;
}(Strategy_1.Strategy));
exports.RemoteFetch = RemoteFetch;
