'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _phantom = require('../phantom');

var _phantom2 = _interopRequireDefault(_phantom);

require('babel-polyfill');

var _out_object = require('../out_object');

var _out_object2 = _interopRequireDefault(_out_object);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe('Command', () => {
    let server;
    let phantom;
    let port;
    beforeAll(done => {
        server = _http2.default.createServer((request, response) => response.end('hi, ' + request.url));
        server.listen(0, () => {
            port = server.address().port;
            done();
        });
    });

    afterAll(() => server.close());
    beforeEach(() => phantom = new _phantom2.default());
    afterEach(() => phantom.exit());

    it('target to be set', () => {
        expect(phantom.createOutObject().target).toBeDefined();
    });

    it('#createOutObject() is a valid OutObject', () => {
        let outObj = phantom.createOutObject();
        expect(outObj).toBeInstanceOf(_out_object2.default);
    });

    it('#property() returns a value set by phantom', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let outObj = phantom.createOutObject();

        yield page.property('onResourceReceived', function (response, out) {
            out.lastResponse = response;
        }, outObj);

        yield page.open(`http://localhost:${ port }/test`);

        let lastResponse = yield outObj.property('lastResponse');

        expect(lastResponse.url).toEqual(`http://localhost:${ port }/test`);
    }));

    it('#property() returns a value set by phantom and node', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let outObj = phantom.createOutObject();

        outObj.test = 'fooBar$';

        yield page.property('onResourceReceived', function (response, out) {
            out.data = out.test + response.url;
        }, outObj);

        yield page.open(`http://localhost:${ port }/test2`);
        let data = yield outObj.property('data');
        expect(data).toEqual(`fooBar$http://localhost:${ port }/test2`);
    }));

    it('#property() works with input params', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let outObj = phantom.createOutObject();

        yield page.property('onResourceReceived', function (response, test, out) {
            out.data = test;
        }, 'test', outObj);

        yield page.open(`http://localhost:${ port }/test2`);
        let data = yield outObj.property('data');
        expect(data).toEqual('test');
    }));
});