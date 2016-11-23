'use strict';

var _command = require('../command');

var _command2 = _interopRequireDefault(_command);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Command', () => {
    it('id to be randomly generated', () => {
        expect(new _command2.default().id).toMatch(/[\da-z]{16}/);
    });

    it('id to be set correctly', () => {
        expect(new _command2.default('abc').id).toEqual('abc');
    });

    it('JSON.stringify(command) to be valid json', () => {
        expect(JSON.stringify(new _command2.default('1', 'target', 'name'))).toMatchSnapshot();
    });
});