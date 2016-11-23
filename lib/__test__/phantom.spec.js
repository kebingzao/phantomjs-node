'use strict';

var _phantomjsPrebuilt = require('phantomjs-prebuilt');

var _phantomjsPrebuilt2 = _interopRequireDefault(_phantomjsPrebuilt);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _phantom = require('../phantom');

var _phantom2 = _interopRequireDefault(_phantom);

var _page = require('../page');

var _page2 = _interopRequireDefault(_page);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe('Phantom', () => {
    let instance;
    beforeAll(() => jest.resetModules());
    beforeAll(() => instance = new _phantom2.default());
    afterAll(() => instance.exit());

    it('#createPage() returns a Promise', () => {
        expect(instance.createPage()).toBeInstanceOf(Promise);
    });

    it('#createPage() resolves to a Page', done => {
        instance.createPage().then(page => {
            expect(page).toBeInstanceOf(_page2.default);
            done();
        });
    });

    it('#create([], {}) execute with no parameters', () => {
        jest.mock('child_process');

        const actual_spawn = require.requireActual('child_process').spawn;
        let mockedSpawn = jest.fn(function () {
            return actual_spawn(...arguments);
        });
        require('child_process').setMockedSpawn(mockedSpawn);

        const MockedProcess = require('../phantom').default;

        let pp = new MockedProcess();
        pp.exit();

        let pathToShim = _path2.default.normalize(__dirname + '/../shim/index.js');
        expect(mockedSpawn).toHaveBeenCalledWith(_phantomjsPrebuilt2.default.path, [pathToShim]);
    });

    it('#create([], {}) execute with undefined phantomjs-prebuilt to throw exception', () => {
        expect(() => new _phantom2.default([], { phantomPath: null })).toThrow();
    });

    it('#create(["--ignore-ssl-errors=yes"]) adds parameter to process', () => {
        jest.mock('child_process');

        const actual_spawn = require.requireActual('child_process').spawn;
        let mockedSpawn = jest.fn(function () {
            return actual_spawn(...arguments);
        });
        require('child_process').setMockedSpawn(mockedSpawn);

        const MockedProcess = require('../phantom').default;

        let pp = new MockedProcess(['--ignore-ssl-errors=yes']);
        pp.exit();

        let pathToShim = _path2.default.normalize(__dirname + '/../shim/index.js');
        expect(mockedSpawn).toHaveBeenCalledWith(_phantomjsPrebuilt2.default.path, ['--ignore-ssl-errors=yes', pathToShim]);
    });

    it('#create([], {phantomPath: \'phantomjs\'}) execute phantomjs from custom path with no parameters', () => {
        jest.mock('child_process');

        const actual_spawn = require.requireActual('child_process').spawn;
        let mockedSpawn = jest.fn(function () {
            return actual_spawn(...arguments);
        });
        require('child_process').setMockedSpawn(mockedSpawn);

        const MockedProcess = require('../phantom').default;

        let pp = new MockedProcess([], { phantomPath: 'phantomjs' });
        pp.exit();

        let pathToShim = _path2.default.normalize(__dirname + '/../shim/index.js');
        expect(mockedSpawn).toHaveBeenCalledWith('phantomjs', [pathToShim]);
        pp.exit();
    });

    it('#create([], {logger: logger}) to log messages', () => {
        let logger = { debug: jest.fn() };

        let pp = new _phantom2.default([], { logger });
        expect(logger.debug).toHaveBeenCalled();
        pp.exit();
    });

    it('#create([], {logLevel: \'debug\'}) change logLevel', () => {
        const logLevel = 'error';

        let pp = new _phantom2.default([], { logLevel });
        expect(pp.logger.transports.console.level).toEqual(logLevel);
        pp.exit();
    });

    it('#create([], {logLevel: \'debug\'}) should not change other log levels', () => {
        const logLevel = 'error';
        let p1 = new _phantom2.default([], { logLevel });
        p1.exit();

        let p2 = new _phantom2.default();
        expect(p2.logger.transports.console.level).toEqual('info');
        p2.exit();
    });

    it('#create("--ignore-ssl-errors=yes") to throw an exception', () => {
        expect(() => new _phantom2.default('--ignore-ssl-errors=yes')).toThrow();
    });

    it('#create(true) to throw an exception', () => {
        expect(() => new _phantom2.default(true)).toThrow();
    });

    it('catches errors when stdin closes unexpectedly', _asyncToGenerator(function* () {
        instance.process.stdin.end();
        try {
            yield instance.createPage();
        } catch (e) {
            expect(e).toEqual(new Error('Error reading from stdin: Error: write after end'));
        }
    }));

    xit('catches errors when stdout closes unexpectedly', _asyncToGenerator(function* () {
        instance.process.stdout.end();
        try {
            yield instance.createPage();
        } catch (e) {
            expect(e).toEqual(new Error('Error reading from stdout: Error: shutdown ENOTCONN'));
        }
    }));
});