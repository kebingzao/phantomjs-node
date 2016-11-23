'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

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
            if (request.url === '/script.js') {
                response.end('window.fooBar = 2;');
            } else if (request.url === '/test.html') {
                response.end('<html><head><title>Page Title</title></head><body>Test</body></html>');
            } else if (request.url === '/upload.html') {
                response.end('<html><head><title>Page Title</title></head><body>' + '<input type="file" id="upload" /></body></html>');
            } else {
                response.end('hi, ' + request.url);
            }
        });
        server.listen(0, () => {
            port = server.address().port;
            done();
        });
    });

    afterAll(() => server.close());
    beforeEach(() => phantom = new _phantom2.default());
    afterEach(() => phantom.exit());

    it('#open() a valid page', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let status = yield page.open(`http://localhost:${ port }/test`);
        expect(status).toEqual('success');
    }));

    it('#property(\'plainText\') returns valid content', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test`);
        let content = yield page.property('plainText');
        expect(content).toEqual('hi, /test');
    }));

    it('#property(\'onResourceRequested\', function(){}) sets property', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        const url = `http://localhost:${ port }/foo-bar-xyz`;
        yield page.property('onResourceRequested', function (requestData, networkRequest, url) {
            networkRequest.changeUrl(url);
        }, url);
        yield page.open(`http://localhost:${ port }/whatever`);
        let content = yield page.property('plainText');
        expect(content).toEqual('hi, /foo-bar-xyz'); // should have been changed to /foo-bar-xyz
    }));

    it('#property(\'onResourceRequested\', function(){}, params...) passes parameters', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        page.property('onResourceRequested', function (requestData, networkRequest, foo, a, b) {
            RESULT = [foo, a, b];
        }, 'foobar', 1, -100);
        yield page.open(`http://localhost:${ port }/whatever`);

        let RESULT = yield phantom.windowProperty('RESULT');
        expect(RESULT).toEqual(['foobar', 1, -100]);
    }));

    it('#property(\'key\', value) sets property', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.property('viewportSize', { width: 800, height: 600 });
        let value = yield page.property('viewportSize');
        expect(value).toEqual({ width: 800, height: 600 });
    }));

    it('#property(\'paperSize\', value) sets value properly with phantom.paperSize', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        page.property('paperSize', {
            width: '8.5in',
            height: '11in',
            header: {
                height: '1cm',
                contents: phantom.callback(function (pageNum, numPages) {
                    return "<h1>Header <span style='float:right'>" + pageNum + ' / ' + numPages + '</span></h1>';
                })
            },
            footer: {
                height: '1cm',
                contents: phantom.callback(function (pageNum, numPages) {
                    return "<h1>Footer <span style='float:right'>" + pageNum + ' / ' + numPages + '</span></h1>';
                })
            }
        });

        yield page.open(`http://localhost:${ port }/test`);
        let file = 'test.pdf';
        yield page.render(file);
        expect(function () {
            _fs2.default.accessSync(file, _fs2.default.F_OK);
        }).not.toThrow();
        _fs2.default.unlinkSync(file);
    }));

    it('#setting(\'javascriptEnabled\') returns true', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let value = yield page.setting('javascriptEnabled');
        expect(value).toBe(true);
    }));

    it('#setting(\'key\', value) sets setting', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.setting('javascriptEnabled', false);
        let value = yield page.setting('javascriptEnabled');
        expect(value).toBe(false);
    }));

    it('#injectJs() properly injects a js file', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test`);
        // inject_example.js: window.foo = 1;
        yield page.injectJs(__dirname + '/inject_example.js');

        let response = yield page.evaluate(function () {
            return foo; // eslint-disable-line no-undef
        });

        expect(response).toEqual(1);
    }));

    it('#includeJs() properly injects a js file', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test`);
        yield page.includeJs(`http://localhost:${ port }/script.js`);
        let response = yield page.evaluate(function () {
            return fooBar; // eslint-disable-line no-undef
        });
        expect(response).toEqual(2);
    }));

    it('#render() creates a file', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test`);
        let file = 'test.png';
        yield page.render(file);
        expect(function () {
            _fs2.default.accessSync(file, _fs2.default.F_OK);
        }).not.toThrow();
        _fs2.default.unlinkSync(file);
    }));

    it('#renderBase64() returns encoded PNG', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test`);
        let content = yield page.renderBase64('PNG');
        expect(content).not.toBeNull();
    }));

    it('#addCookie() adds a cookie to the page', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.addCookie({
            'name': 'Valid-Cookie-Name',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': new Date().getTime() + 1000 * 60 * 60
        });
        let cookies = yield page.property('cookies');
        expect(cookies[0].name).toEqual('Valid-Cookie-Name');
    }));

    it('#clearCookies() removes all cookies', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();

        // Probably not the best test if this method doesn't work
        yield page.addCookie({
            'name': 'Valid-Cookie-Name',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': new Date().getTime() + 1000 * 60 * 60
        });

        yield page.clearCookies();
        let cookies = yield page.property('cookies');
        expect(cookies).toEqual([]);
    }));

    it('#deleteCookie() removes one cookie', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();

        // Probably not the best test if this method doesn't work
        yield page.addCookie({
            'name': 'cookie-1',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': new Date().getTime() + 1000 * 60 * 60
        });

        yield page.addCookie({
            'name': 'cookie-2',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': new Date().getTime() + 1000 * 60 * 60
        });

        let cookies = yield page.property('cookies');
        expect(cookies.length).toBe(2);

        yield page.deleteCookie('cookie-1');
        cookies = yield page.property('cookies');

        expect(cookies.length).toBe(1);
        expect(cookies[0].name).toEqual('cookie-2');
    }));

    it('#reject(...) works when there is an error', _asyncToGenerator(function* () {
        try {
            yield phantom.execute('page', 'nonexistentCommand');
        } catch (e) {
            expect(e.message).toEqual("'nonexistentCommand' isn't a command.");
        }
    }));

    it('#open opens multiple pages', _asyncToGenerator(function* () {
        let page1 = yield phantom.createPage();
        yield page1.open(`http://localhost:${ port }/test1`);
        page1.close();

        let page2 = yield phantom.createPage();
        yield page2.open(`http://localhost:${ port }/test2`);
        let content = yield page2.property('plainText');
        expect(content).toEqual('hi, /test2');
        page2.close();
    }));

    it('#windowProperty() returns a window value', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();

        yield page.property('onResourceReceived', function (response) {
            lastResponse = response;
        });
        yield page.open(`http://localhost:${ port }/test`);
        let lastResponse = yield phantom.windowProperty('lastResponse');
        expect(lastResponse.url).toEqual(`http://localhost:${ port }/test`);
    }));

    it('#setContent() works with custom url', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let html = '<html><head><title>setContent Title</title></head><body></body></html>';

        yield page.setContent(html, `http://localhost:${ port }/`);

        let response = yield page.evaluate(function () {
            return [document.title, location.href];
        });

        expect(response).toEqual(['setContent Title', `http://localhost:${ port }/`]);
    }));

    it('#sendEvent() sends an event', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let html = '<html  onclick="docClicked = true;"><head><title>setContent Title</title>' + '</head><body></body></html>';

        yield page.setContent(html, `http://localhost:${ port }/`);
        yield page.sendEvent('click', 1, 2);

        let response = yield page.evaluate(function () {
            return window.docClicked;
        });

        expect(response).toBe(true);
    }));

    it('#switchToFrame(framePosition) will switch to frame of framePosition', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let html = '<html><head><title>Iframe Test</title></head><body>' + `<iframe id="testframe" src="http://localhost:${ port }/test.html"></iframe></body></html>`;

        yield page.setContent(html, `http://localhost:${ port }/`);
        yield page.switchToFrame(0);

        let inIframe = yield page.evaluate(function () {
            // are we in the iframe?
            return window.frameElement && window.frameElement.id === 'testframe';
        });

        // confirm we are in an iframe
        expect(inIframe).toBe(true);
    }));

    it('#switchToMainFrame() will switch back to the main frame', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let html = '<html><head><title>Iframe Test</title></head><body>' + `<iframe id="testframe" src="http://localhost:${ port }/test.html"></iframe></body></html>`;

        yield page.setContent(html, `http://localhost:${ port }/`);
        // need to switch to child frame here to test switchToMainFrame() works
        yield page.switchToFrame(0);
        yield page.switchToMainFrame();

        let inMainFrame = yield page.evaluate(function () {
            // are we in the main frame?
            return !window.frameElement;
        });

        // confirm we are in the main frame
        expect(inMainFrame).toBe(true);
    }));

    it('#reload() will reload the current page', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let reloaded = false;

        yield page.open(`http://localhost:${ port }/test`);
        yield page.on('onNavigationRequested', function (url, type) {
            if (type === 'Reload') {
                reloaded = true;
            }
        });
        yield page.reload();

        expect(reloaded).toBe(true);
    }));

    it('#invokeAsyncMethod(\'includeJs\', \'http://localhost:port/script.js\') executes correctly', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test`);
        yield page.invokeAsyncMethod('includeJs', `http://localhost:${ port }/script.js`);
        let response = yield page.evaluate(function () {
            return fooBar; // eslint-disable-line no-undef
        });
        expect(response).toEqual(2);
    }));

    it('#invokeAsyncMethod(\'open\', \'http://localhost:port/test\') executes correctly', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        let status = yield page.invokeAsyncMethod('open', `http://localhost:${ port }/test`);
        expect(status).toEqual('success');
    }));

    it('#invokeMethod(\'evaluate\', \'function () { return document.title }\') executes correctly', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test.html`);
        let response = yield page.invokeMethod('evaluate', 'function () { return document.title }');
        expect(response).toEqual('Page Title');
    }));

    it('#invokeMethod(\'renderBase64\') executes correctly', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/test`);
        let content = yield page.invokeMethod('renderBase64', 'PNG');
        expect(content).not.toBeNull();
    }));

    it('#defineMethod(name, definition) defines a method', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.defineMethod('getZoomFactor', function () {
            return this.zoomFactor; // eslint-disable-line no-invalid-this
        });
        let zoomFactor = yield page.invokeMethod('getZoomFactor');
        expect(zoomFactor).toEqual(1);
    }));

    it('#openUrl() opens a URL', function (done) {
        phantom.createPage().then(function (page) {
            page.on('onLoadFinished', false, function (status) {
                expect(status).toEqual('success');
                done();
            });
            return page.openUrl(`http://localhost:${ port }/test`, 'GET', {});
        });
    });

    it('#setProxy() sets the proxy', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.setProxy(`http://localhost:${ port }/`);
        yield page.open('http://phantomjs.org/');
        let text = yield page.property('plainText');
        expect(text).toEqual('hi, http://phantomjs.org/');
    }));

    it('#property = something shows a warning', _asyncToGenerator(function* () {
        if (typeof Proxy === 'function') {
            let logger = { warn: jest.fn() };

            let pp = new _phantom2.default([], { logger });
            let page = yield pp.createPage();

            try {
                page.foo = 'test';
            } catch (e) {
                expect(e).toBeInstanceOf(TypeError);
            } finally {
                expect(logger.warn).toHaveBeenCalled();
                pp.exit();
            }
        }
    }));

    it('#goBack()', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.open(`http://localhost:${ port }/test1`);
        }).then(function () {
            return page.open(`http://localhost:${ port }/test2`);
        }).then(function () {
            page.on('onNavigationRequested', false, function () {
                done();
            });
            return page.goBack();
        });
    });

    it('#uploadFile() inserts file into file input field', _asyncToGenerator(function* () {
        let page = yield phantom.createPage();
        yield page.open(`http://localhost:${ port }/upload.html`);
        yield page.uploadFile('#upload', process.env.PWD + '/package.json');
        let response = yield page.evaluate(function () {
            return document.querySelector('#upload').files[0].name;
        });
        expect(response).toEqual('package.json');
    }));
});