'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = randId;

/**
 * Generate an ascii random ID
 *
 * @param  {Number} minBytes number of bytes the ID should contain
 * @return {String} a textual ID of `bytes` entropy
 */
function randId(minBytes) {
    const ret = [];
    for (; minBytes > 0; minBytes -= 4) {
        // Make a unique string of pow(2, 32) entropy.
        ret.push((Math.random() * (-1 >>> 0)).toString(36)); // eslint-disable-line no-bitwise
    }
    return ret.join('');
}