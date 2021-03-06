import * as path from 'path';
import * as stream from 'stream';
import * as Promise from 'bluebird';
import * as cget from '..';

import { Server } from './ds9k';

const content = '<html></html>\n';
let errorCount = 0;

function expectedResult(name: string, result: cget.CacheResult, status: number) {
	const chunkList: Buffer[] = [];

	if(result.status != status) {
		console.error('Error in test: ' + name);
		console.error('Expected status: ' + status);
		console.error('Got status: ' + result.status);
		++errorCount;
	}

	result.stream.on('data', (chunk: Buffer) => chunkList.push(chunk));

	result.stream.on('error', (err: Error) => {
		console.error('Error in test: ' + name);
		console.error('Stream reported error:');
		console.error(err);
		++errorCount;
	});

	result.stream.on('end', () => {
		const data = Buffer.concat(chunkList).toString('utf-8');

		if(data != content) {
			console.error('Error in test: ' + name);
			console.error('Incorrect data:');
			console.error(data);
			++errorCount;
		} else {
			console.log('Success in test: ' + name);
		}
	})
}

function unexpectedResult(name: string, result: any) {
	console.error('Error in test: ' + name);
	console.error('Expected error...');
	console.error('Got result: ' + result);
	++errorCount;
}

function unexpectedError(name: string, err: Error) {
	console.error('Error in test: ' + name);
	console.error('Unexpected error:');
	console.error(err);
	++errorCount;
}

function expectedError(name: string, err: Error, code: number | string | string[]) {
	const result = (err as any).code as number || (err as any).status as string;

	if(typeof(code) == 'object') {
		const codeList = code;

		code = codeList[0];

		for(let valid of codeList) {
			if(result == valid) code = valid;
		}
	}

	if(result == code) {
		console.log('Success in test: ' + name + ' (' + result + ')');
	} else {
		console.error('Error in test: ' + name);
		console.error('Expected status: ' + code);
		console.error('Got status: ' + result);
		++errorCount;
	}
}

function runTests(port: number, concurrency: number) {
	const cwd = __dirname;
	const cachePath = path.resolve(cwd, 'cache');

	const storedPath = 'cache/http/localhost/index.html';
	const missingName = 'missing-' + Math.random();
	const origin = 'http://localhost:' + port;

	const validLocal = [
		'file://' + path.resolve(__dirname, storedPath),
		'./' + storedPath,
		'../test/' + storedPath
	];

	const invalidLocal = [
		'file:///' + missingName + '/index.html',
		'file:///' + missingName + '/',
		'file:///' + missingName,
		'./' + missingName,
		'../test/' + missingName,
		'../test/' + missingName + '/',
		'../test/' + missingName + '/index.html'
	];

	const validCached = [
		origin + '/index.html',
		origin + '/',
		origin,
		origin + '/redirected-index.html'
	];

	const invalidCachedRemote = [
		'EPERM', [ 'ENOTFOUND', 'EAI_AGAIN' ], 'http://example.invalid/',
		'EPERM', 404, origin + '/' + missingName,
		404, 404, origin + '/missing.html',
		404, 404, origin + '/redirected-missing.html'
	];

	const localLive = new cget.Cache(cachePath, {
		allowLocal: true,
		allowRemote: false,
		allowCacheRead: false,
		allowCacheWrite: false,
		concurrency,
		cwd
	});

	const remoteCache = new cget.Cache(cachePath, {
		allowLocal: false,
		allowRemote: false,
		allowCacheRead: true,
		allowCacheWrite: false,
		concurrency,
		cwd
	});

	const remoteLive = new cget.Cache(cachePath, {
		allowLocal: false,
		allowRemote: true,
		allowCacheRead: false,
		allowCacheWrite: false,
		retryCount: 10,
		retryDelay: 100,
		concurrency,
		cwd
	});

	const remoteWritableLive = new cget.Cache(path.resolve(cwd, 'cache2'), {
		allowLocal: false,
		allowRemote: true,
		allowCacheRead: false,
		allowCacheWrite: true,
		retryCount: 10,
		retryDelay: 100,
		concurrency,
		cwd
	});

	const testList: Promise<any>[] = [];

	for(let num = 0; num < validLocal.length; ++num) {
		const name = 'Valid local fetch ' + num;

		testList.push(
			localLive.fetch(
				validLocal[num]
			).then((result: cget.CacheResult) =>
				expectedResult(name, result, 200)
			).catch((err: Error) => unexpectedError(name, err))
		);
	}

	for(let num = 0; num < validLocal.length; ++num) {
		const name = 'Forbidden local fetch ' + num;

		testList.push(
			remoteCache.fetch(
				validLocal[num]
			).then((result: cget.CacheResult) =>
				unexpectedResult(name, result)
			).catch((err: Error) => expectedError(name, err, 'EPERM'))
		);
	}

	for(let num = 0; num < invalidLocal.length; ++num) {
		const name = 'Invalid local fetch ' + num;

		testList.push(
			localLive.fetch(
				invalidLocal[num]
			).then((result: cget.CacheResult) =>
				unexpectedResult(name, result)
			).catch((err: Error) => expectedError(name, err, 'ENOENT'))
		);
	}

	for(let num = 0; num < validCached.length; ++num) {
		const name = 'Valid cached fetch ' + num;

		testList.push(
			remoteCache.fetch(
				validCached[num]
			).then((result: cget.CacheResult) =>
				expectedResult(name, result, 200)
			).catch((err: Error) => unexpectedError(name, err))
		);
	}

	for(let num = 0; num < invalidCachedRemote.length; num += 3) {
		const name = 'Invalid cached fetch ' + (num / 3);
		const code = invalidCachedRemote[num];

		testList.push(
			remoteCache.fetch(
				invalidCachedRemote[num + 2] as string
			).then((result: cget.CacheResult) =>
				unexpectedResult(name, result)
			).catch((err: Error) => expectedError(name, err, code))
		);
	}

	for(let num = 0; num < validCached.length; ++num) {
		const name = 'Forbidden cached fetch ' + num;

		testList.push(
			localLive.fetch(
				validCached[num]
			).then((result: cget.CacheResult) =>
				unexpectedResult(name, result)
			).catch((err: Error) => expectedError(name, err, 'EPERM'))
		);
	}

	for(let num = 0; num < validCached.length; ++num) {
		const name = 'Valid remote fetch ' + num;

		testList.push(
			remoteLive.fetch(
				validCached[num]
			).then((result: cget.CacheResult) =>
				expectedResult(name, result, 200)
			).catch((err: Error) => unexpectedError(name, err))
		);
	}

	for(let num = 0; num < invalidCachedRemote.length; num += 3) {
		const name = 'Invalid remote fetch ' + (num / 3);
		const code = invalidCachedRemote[num + 1];

		testList.push(
			remoteLive.fetch(
				invalidCachedRemote[num + 2] as string
			).then((result: cget.CacheResult) =>
				unexpectedResult(name, result)
			).catch((err: Error) => expectedError(name, err, code))
		);
	}

	for(let num = 0; num < validCached.length; ++num) {
		const name = 'Stored remote fetch ' + num;

		testList.push(
			remoteWritableLive.fetch(
				validCached[num]
			).then((result: cget.CacheResult) =>
				expectedResult(name, result, 200)
			).catch((err: Error) => unexpectedError(name, err))
		);
	}

	for(let num = 0; num < invalidCachedRemote.length; num += 3) {
		const name = 'Invalid stored remote fetch ' + (num / 3);
		const code = invalidCachedRemote[num + 1];

		testList.push(
			remoteWritableLive.fetch(
				invalidCachedRemote[num + 2] as string
			).then((result: cget.CacheResult) =>
				unexpectedResult(name, result)
			).catch((err: Error) => expectedError(name, err, code))
		);
	}

	return(Promise.all(testList));
}

const server = new Server(8080);
// const server = { ready: Promise.resolve(true), close: () => {} };

const promiseList: any[] = [];

for(let i = 0; i < 10; ++i) {
	promiseList.push(runTests(8080, Infinity));
}

promiseList.push(runTests(8080, 1));

server.ready.then(() => Promise.all(promiseList)).then(
	() => server.close()
).then(
	() => {
		console.log('Number of errors: ' + errorCount);
		process.exit(errorCount)
	}
);
