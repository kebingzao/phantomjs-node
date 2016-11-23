'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

require('babel-polyfill');

var _phantom = require('../phantom');

var _phantom2 = _interopRequireDefault(_phantom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe('Page', () => {
    let server;
    let phantom;
    let port;
    beforeAll(done => {
        server = _http2.default.createServer((request, response) => {
            response.end('<html><head><title>Page Title</title></head><body>Test</body></html>');
        });

        server.listen(0, () => {
            port = server.address().port;
            done();
        });
    });

    afterAll(() => server.close());
    beforeEach(() => phantom = new _phantom2.default());
    afterEach(() => phantom.exit());

    it('#evaluate(function(){return document.title}) executes correctly', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test.html`);
        let response = yield page.evaluate(function () {
            return document.title;
        });
        expect(response).toEqual('Page Title');
    }));

    it('#evaluate(function(){...}) executes correctly', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let response = yield page.evaluate(function () {
            return 'test';
        });
        expect(response).toEqual('test');
    }));

    it('#evaluate(function(arg){...}, argument) executes correctly with a non-null argument', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let response = yield page.evaluate(function (arg) {
            return 'Value: ' + arg;
        }, 'test');
        expect(response).toEqual('Value: test');
    }));

    it('#evaluate(function(arg){...}, argument) executes correctly with a null argument', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let response = yield page.evaluate(function (arg) {
            return 'Value is null: ' + (arg === null);
        }, null);
        expect(response).toEqual('Value is null: true');
    }));

    it('#evaluateAsync(function(){...}) executes correctly', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.on('onCallback', function (response) {
            expect(response).toEqual('test');
        });
        yield page.evaluateAsync(function () {
            window.callPhantom('test');
        });
    }));

    it('#evaluateAsync(function(){...}) executes correctly with a delay and a non-null argument', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.on('onCallback', function (response) {
            expect(response).toEqual('testarg');
        });
        yield page.evaluateAsync(function (arg) {
            window.callPhantom('test' + arg);
        }, 0, 'arg');
    }));

    it('#evaluateJavaScript(\'function(){return document.title}\') executes correctly', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test.html`);
        let response = yield page.evaluate('function () { return document.title }');
        expect(response).toEqual('Page Title');
    }));

    it('#evaluateJavaScript(\'function(){...}\') executes correctly', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let response = yield page.evaluate('function () { return \'test\' }');
        expect(response).toEqual('test');
    }));
});