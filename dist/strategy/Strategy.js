"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Strategy = /** @class */ (function () {
    function Strategy(cache, options) {
        this.cache = cache;
        this.options = options;
    }
    Strategy.prototype.store = function (address, data, headers) { return (false); };
    return Strategy;
}());
exports.Strategy = Strategy;
