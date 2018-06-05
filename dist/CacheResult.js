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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var internalHeaderTbl = {
    'cget-stamp': true,
    'cget-status': true,
    'cget-message': true,
    'cget-target': true
};
exports.defaultHeaders = {
    'cget-status': 200,
    'cget-message': 'OK'
};
function removeInternalHeaders(headers) {
    var output = {};
    for (var _i = 0, _a = Object.keys(headers); _i < _a.length; _i++) {
        var key = _a[_i];
        if (!internalHeaderTbl[key])
            output[key] = headers[key];
    }
    return (output);
}
var CacheResult = /** @class */ (function () {
    function CacheResult(stream, state, headers) {
        this.stream = stream;
        this.state = state;
        this.address = state.address;
        this.status = headers['cget-status'] || 200;
        this.message = headers['cget-message'] || 'OK';
        this.headers = removeInternalHeaders(headers);
    }
    CacheResult.prototype.retry = function (err) {
        this.state.retryNow();
        this.state.onKill(err);
    };
    CacheResult.prototype.abort = function (err) {
        this.state.abort();
        this.state.onKill(err);
    };
    return CacheResult;
}());
exports.CacheResult = CacheResult;
function prototype(value) {
    return (function (target, key) {
        Object.defineProperty(target, key, {
            configurable: true,
            enumerable: false,
            value: value,
            writable: true
        });
        target[key] = value;
    });
}
exports.CustomError = function CustomError(message) {
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, CustomError);
    }
    else {
        var dummy_1 = Error.apply(this, arguments);
        Object.defineProperty(this, 'stack', {
            configurable: true,
            get: function () { return dummy_1.stack; }
        });
    }
    this.message = message;
};
exports.CustomError.prototype = Object.create(Error.prototype, {
    constructor: {
        configurable: true,
        value: exports.CustomError,
        writable: true
    }
});
var FetchError = /** @class */ (function (_super) {
    __extends(FetchError, _super);
    function FetchError(code, message) {
        var _this = _super.call(this, message || code) || this;
        _this.code = code;
        return _this;
    }
    __decorate([
        prototype('FetchError')
    ], FetchError.prototype, "name", void 0);
    return FetchError;
}(exports.CustomError));
exports.FetchError = FetchError;
var CachedError = /** @class */ (function (_super) {
    __extends(CachedError, _super);
    function CachedError(status, message, headers) {
        if (headers === void 0) { headers = {}; }
        var _this = _super.call(this, status + (message ? ' ' + message : '')) || this;
        _this.status = status;
        _this.headers = removeInternalHeaders(headers);
        return _this;
    }
    __decorate([
        prototype('CustomError')
    ], CachedError.prototype, "name", void 0);
    return CachedError;
}(exports.CustomError));
exports.CachedError = CachedError;
