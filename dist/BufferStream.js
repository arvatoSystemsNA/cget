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
var stream = require("stream");
var BufferStream = /** @class */ (function (_super) {
    __extends(BufferStream, _super);
    function BufferStream() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.len = 0;
        return _this;
    }
    BufferStream.prototype._transform = function (chunk, encoding, flush) {
        this.len += chunk.length;
        flush(null, chunk);
    };
    return BufferStream;
}(stream.Transform));
exports.BufferStream = BufferStream;
