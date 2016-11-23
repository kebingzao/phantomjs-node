'use strict';

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _phantom = require('../phantom');

var _phantom2 = _interopRequireDefault(_phantom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('index.js', () => {
    it('phantom#create().then() returns a new Phantom instance', () => {
        return _index2.default.create().then(ph => {
            expect(ph).toBeInstanceOf(_phantom2.default);
            ph.exit();
        });
    });

    it('phantom#create() returns a new Promise instance', () => {
        let promise = _index2.default.create();
        expect(promise).toBeInstanceOf(Promise);
        return promise.then(ph => ph.exit());
    });
});