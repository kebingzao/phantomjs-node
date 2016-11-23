'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _phantom = require('../phantom');

var _phantom2 = _interopRequireDefault(_phantom);

require('babel-polyfill');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe('Page', () => {
        let server;
        let phantom;
        let port;
        beforeAll(done => {
                server = _http2.default.createServer((request, response) => {
                        response.end('hi, ' + request.url);
                });
                server.listen(0, () => {
                        port = server.address().port;
                        done();
                });
        });

        afterAll(() => server.close());
        beforeEach(() => phantom = new _phantom2.default());
        afterEach(() => phantom.exit());

        it('#on() can register an event in the page and run the code locally', _asyncToGenerator(function* () {
                let page = yield phantom.createPage();
                let runnedHere = false;

                yield page.on('onResourceReceived', function () {
                        runnedHere = true;
                });

                yield page.open(`http://localhost:${ port }/test`);

                expect(runnedHere).toBe(true);
        }));

        it('#on() event registered does not run if not triggered', _asyncToGenerator(function* () {
                let page = yield phantom.createPage();
                let runnedHere = false;

                yield page.on('onResourceReceived', function () {
                        runnedHere = true;
                });

                expect(runnedHere).toBe(false);
        }));

        it('#on() can register more than one event of the same type', _asyncToGenerator(function* () {
                let page = yield phantom.createPage();
                let runnedHere = false;

                yield page.on('onResourceReceived', function () {
                        runnedHere = true;
                });

                let runnedHereToo = false;

                yield page.on('onResourceReceived', function () {
                        runnedHereToo = true;
                });

                yield page.open(`http://localhost:${ port }/test`);

                expect(runnedHere).toBe(true);
                expect(runnedHereToo).toBe(true);
        }));

        it('#on() can pass parameters', _asyncToGenerator(function* () {
                let page = yield phantom.createPage();
                let parameterProvided = false;

                yield page.on('onResourceReceived', function (status, param) {
                        parameterProvided = param;
                }, 'param');

                yield page.open(`http://localhost:${ port }/test`);

                expect(parameterProvided).toBe('param');
        }));

        it('#on() can register an event in the page which code runs in phantom runtime', _asyncToGenerator(function* () {
                let page = yield phantom.createPage();
                let runnedHere = false;

                yield page.on('onLoadFinished', true, function () {
                        runnedHere = true;
                        runnedInPhantomRuntime = true;
                });

                yield page.open(`http://localhost:${ port }/test`);

                let runnedInPhantomRuntime = yield phantom.windowProperty('runnedInPhantomRuntime');

                expect(runnedHere).toBe(false);
                expect(runnedInPhantomRuntime).toBe(true);
        }));

        it('#on() can pass parameters to functions to be executed in phantom runtime', _asyncToGenerator(function* () {
                let page = yield phantom.createPage();

                yield page.on('onResourceReceived', true, function (status, param) {
                        parameterProvided = param;
                }, 'param');

                yield page.open(`http://localhost:${ port }/test`);

                let parameterProvided = yield phantom.windowProperty('parameterProvided');

                expect(parameterProvided).toBe('param');
        }));

        it('#on() event supposed to run in phantom runtime wont run if not triggered', _asyncToGenerator(function* () {
                let page = yield phantom.createPage();

                yield page.on('onResourceReceived', true, function () {
                        runnedInPhantomRuntime = true;
                });

                let runnedInPhantomRuntime = yield phantom.windowProperty('runnedInPhantomRuntime');

                expect(runnedInPhantomRuntime).toBeFalsy();
        }));

        it('#on() can register at the same event to run locally or in phantom runtime', _asyncToGenerator(function* () {
                let page = yield phantom.createPage();
                let runnedHere = false;

                yield page.on('onResourceReceived', true, function () {
                        runnedInPhantomRuntime = true;
                });

                yield page.on('onResourceReceived', function () {
                        runnedHere = true;
                });

                yield page.open(`http://localhost:${ port }/test`);

                let runnedInPhantomRuntime = yield phantom.windowProperty('runnedInPhantomRuntime');

                expect(runnedHere).toBe(true);
                expect(runnedInPhantomRuntime).toBe(true);
        }));

        it('#off() can disable an event whose listener is going to run locally', _asyncToGenerator(function* () {

                let page = yield phantom.createPage();
                let runnedHere = false;

                yield page.on('onResourceReceived', function () {
                        runnedHere = true;
                });

                yield page.off('onResourceReceived');

                yield page.open(`http://localhost:${ port }/test`);

                expect(runnedHere).toBe(false);
        }));

        it('#off() can disable an event whose listener is going to run on the phantom process', _asyncToGenerator(function* () {

                let page = yield phantom.createPage();

                yield page.on('onResourceReceived', true, function () {
                        runnedInPhantomRuntime = true;
                });

                yield page.off('onResourceReceived');

                yield page.open(`http://localhost:${ port }/test`);

                let runnedInPhantomRuntime = yield phantom.windowProperty('runnedInPhantomRuntime');

                expect(runnedInPhantomRuntime).toBeFalsy();
        }));
});