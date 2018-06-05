"use strict";
// This file is part of cget, copyright (c) 2015-2017 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
/** Asynchronous versions of fs methods, wrapped by Bluebird. */
var statAsync = Promise.promisify(fs.stat, { context: fs });
var renameAsync = Promise.promisify(fs.rename, { context: fs });
var mkdirAsync = Promise.promisify(fs.mkdir, { context: fs });
/*
export const fsa = {
    stat: Promise.promisify(fs.stat),
    open: Promise.promisify(fs.open),
    rename: Promise.promisify(fs.rename) as (src: string, dst: string) => Promise<{}>,
    mkdir: Promise.promisify(fs.mkdir) as (name: string) => Promise<{}>,
    readFile: Promise.promisify(fs.readFile) as any as (name: string, options: {encoding: string; flag?: string;}) => Promise<string>,
    writeFile: Promise.promisify(fs.writeFile) as (name: string, content: string, options: {encoding: string; flag?: string;}) => Promise<{}>
};
*/
var again = {};
/** Promise while loop. */
function repeat(fn) {
    return (Promise.try(function () {
        return fn(again);
    }).then(function (result) {
        return (result == again) ? repeat(fn) : result;
    }));
}
exports.repeat = repeat;
/** Create a new directory and its parent directories.
  * If a path component to create conflicts with an existing file,
  * rename to file to <component>/<indexName>. */
function mkdirp(pathName, indexName) {
    var partList = path.resolve(pathName).split(path.sep);
    var prefixList = partList.slice(0);
    var pathPrefix;
    // Remove path components until an existing directory is found.
    return (repeat(function (again) {
        if (!prefixList.length)
            return;
        pathPrefix = prefixList.join(path.sep);
        return (statAsync(pathPrefix).then(function (stats) {
            if (stats.isFile()) {
                // Trying to convert a file into a directory.
                // Rename the file to indexName and move it into the new directory.
                var tempPath = pathPrefix + '.' + makeTempSuffix(6);
                return (renameAsync(pathPrefix, tempPath).then(function () {
                    return mkdirAsync(pathPrefix);
                }).then(function () {
                    return renameAsync(tempPath, path.join(pathPrefix, indexName));
                }));
            }
            else if (!stats.isDirectory()) {
                throw (new Error('Tried to create a directory inside something weird: ' + pathPrefix));
            }
        }).catch(function (err) {
            // Re-throw unexpected errors.
            if (err.code != 'ENOENT' && err.code != 'ENOTDIR')
                throw (err);
            prefixList.pop();
            return (again);
        }));
    })).then(function () { return Promise.reduce(
    // Create path components that didn't exist yet.
    partList.slice(prefixList.length), function (pathPrefix, part, index, len) {
        var pathNew = pathPrefix + path.sep + part;
        return (Promise.try(function () {
            return mkdirAsync(pathNew);
        }).catch(function (err) {
            // Because of a race condition with simultaneous cache stores,
            // the directory might already exist.
            if (err.code != 'EEXIST')
                throw (err);
        }).then(function () {
            return pathNew;
        }));
    }, pathPrefix); });
}
exports.mkdirp = mkdirp;
/** Create a string of random letters and numbers. */
function makeTempSuffix(length) {
    return (Math.floor((Math.random() + 1) * Math.pow(36, length))
        .toString(36)
        .substr(1));
}
exports.makeTempSuffix = makeTempSuffix;
