"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
let mockedSpawn;
function setMockedSpawn(mock) {
    mockedSpawn = mock;
}

const spawn = function () {
    return mockedSpawn(...arguments);
};

exports.spawn = spawn;
exports.setMockedSpawn = setMockedSpawn;