'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _phantomjsPrebuilt = require('phantomjs-prebuilt');

var _phantomjsPrebuilt2 = _interopRequireDefault(_phantomjsPrebuilt);

var _child_process = require('child_process');

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _split = require('split2');

var _split2 = _interopRequireDefault(_split);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _page = require('./page');

var _page2 = _interopRequireDefault(_page);

var _command = require('./command');

var _command2 = _interopRequireDefault(_command);

var _out_object = require('./out_object');

var _out_object2 = _interopRequireDefault(_out_object);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//import Linerstream from 'linerstream';
const defaultLogLevel = process.env.DEBUG === 'true' ? 'debug' : 'info';
const NOOP = 'NOOP';

/**
 * Creates a logger using winston
 */
function createLogger() {
    return new _winston2.default.Logger({
        transports: [new _winston2.default.transports.Console({
            level: defaultLogLevel,
            colorize: true
        })]
    });
}

const defaultLogger = createLogger();

/**
 * A phantom instance that communicates with phantomjs
 */
class Phantom {

    /**
     * Creates a new instance of Phantom
     *
     * @param args command args to pass to phantom process
     * @param [phantomPath] path to phantomjs executable
     * @param [logger] object containing functions used for logging
     * @param [logLevel] log level to apply on the logger (if unset or default)
     */
    constructor() {
        let args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
            phantomPath: _phantomjsPrebuilt2.default.path,
            logger: defaultLogger,
            logLevel: defaultLogLevel
        },
            _ref$phantomPath = _ref.phantomPath;

        let phantomPath = _ref$phantomPath === undefined ? _phantomjsPrebuilt2.default.path : _ref$phantomPath;
        var _ref$logger = _ref.logger;
        let logger = _ref$logger === undefined ? defaultLogger : _ref$logger;
        var _ref$logLevel = _ref.logLevel;
        let logLevel = _ref$logLevel === undefined ? defaultLogLevel : _ref$logLevel;

        if (!Array.isArray(args)) {
            throw new Error('Unexpected type of parameters. Expecting args to be array.');
        }

        if (typeof phantomPath !== 'string') {
            throw new Error('PhantomJS binary was not found. ' + 'This generally means something went wrong when installing phantomjs-prebuilt. Exiting.');
        }

        if (typeof logger !== 'object') {
            throw new Error('logger must be ba valid object.');
        }

        logger.debug = logger.debug || (() => undefined);
        logger.info = logger.info || (() => undefined);
        logger.warn = logger.warn || (() => undefined);
        logger.error = logger.error || (() => undefined);

        this.logger = logger;

        if (logLevel !== defaultLogLevel) {
            this.logger = createLogger();
            this.logger.transports.console.level = logLevel;
        }

        const pathToShim = _path2.default.normalize(__dirname + '/shim/index.js');
        this.logger.debug(`Starting ${ phantomPath } ${ args.concat([pathToShim]).join(' ') }`);

        this.process = (0, _child_process.spawn)(phantomPath, args.concat([pathToShim]));
        this.process.stdin.setDefaultEncoding('utf-8');

        this.commands = new Map();
        this.events = new Map();

        //this.process.stdout.pipe(new Linerstream()).on('data', data => {
        this.process.stdout.pipe((0, _split2.default)()).on('data', data => {
            const message = data.toString('utf8');
            if (message[0] === '>') {
                // Server end has finished NOOP, lets allow NOOP again..
                if (message === '>' + NOOP) {
                    this.isNoOpInProgress = false;
                    return;
                }
                const json = message.substr(1);
                this.logger.debug('Parsing: %s', json);

                const parsedJson = JSON.parse(json);
                const command = this.commands.get(parsedJson.id);

                if (command != null) {
                    const deferred = command.deferred;

                    if (deferred != null) {
                        if (parsedJson.error === undefined) {
                            deferred.resolve(parsedJson.response);
                        } else {
                            deferred.reject(new Error(parsedJson.error));
                        }
                    } else {
                        this.logger.error('deferred object not found for command.id: ' + parsedJson.id);
                    }

                    this.commands.delete(command.id);
                } else {
                    this.logger.error('command not found for command.id: ' + parsedJson.id);
                }
            } else if (message.indexOf('<event>') === 0) {
                const json = message.substr(7);
                this.logger.debug('Parsing: %s', json);
                const event = JSON.parse(json);

                const emitter = this.events.get(event.target);
                if (emitter) {
                    emitter.emit.apply(emitter, [event.type].concat(event.args));
                }
            } else {
                this.logger.info(message);
            }
        });

        this.process.stderr.on('data', data => this.logger.error(data.toString('utf8')));
        this.process.on('exit', code => {
            this.logger.debug(`Child exited with code {${ code }}`);
            this._rejectAllCommands(`Phantom process stopped with exit code ${ code }`);
        });
        this.process.on('error', error => {
            this.logger.error(`Could not spawn [${ phantomPath }] executable. ` + 'Please make sure phantomjs is installed correctly.');
            this.logger.error(error);
            this.kill(`Process got an error: ${ error }`);
            process.exit(1);
        });

        this.process.stdin.on('error', e => {
            this.logger.debug(`Child process received error ${ e }, sending kill signal`);
            this.kill(`Error reading from stdin: ${ e }`);
        });

        this.process.stdout.on('error', e => {
            this.logger.debug(`Child process received error ${ e }, sending kill signal`);
            this.kill(`Error reading from stdout: ${ e }`);
        });

        this.heartBeatId = setInterval(this._heartBeat.bind(this), 100);
    }

    /**
     * Returns a value in the global space of phantom process
     * @returns {Promise}
     */
    windowProperty() {
        return this.execute('phantom', 'windowProperty', [].slice.call(arguments));
    }

    /**
     * Returns a new instance of Promise which resolves to a {@link Page}.
     * @returns {Promise.<Page>}
     */
    createPage() {
        const logger = this.logger;
        return this.execute('phantom', 'createPage').then(response => {
            let page = new _page2.default(this, response.pageId);
            if (typeof Proxy === 'function') {
                page = new Proxy(page, {
                    set: function (target, prop) {
                        logger.warn(`Using page.${ prop } = ...; is not supported. Use page.property('${ prop }', ...) ` + 'instead. See the README file for more examples of page#property.');
                        return false;
                    }
                });
            }
            return page;
        });
    }

    /**
     * Creates a special object that can be used for returning data back from PhantomJS
     * @returns {OutObject}
     */
    createOutObject() {
        return new _out_object2.default(this);
    }

    /**
     * Used for creating a callback in phantomjs for content header and footer
     * @param obj
     */
    callback(obj) {
        return { transform: true, target: obj, method: 'callback', parent: 'phantom' };
    }

    /**
     * Executes a command object
     * @param command the command to run
     * @returns {Promise}
     */
    executeCommand(command) {
        this.commands.set(command.id, command);

        let json = JSON.stringify(command, (key, val) => {
            if (key[0] === '_') {
                return undefined;
            } else if (typeof val === 'function') {
                if (!val.hasOwnProperty('prototype')) {
                    this.logger.warn('Arrow functions such as () => {} are not supported in PhantomJS. ' + 'Please use function(){} or compile to ES5.');
                    throw new Error('Arrow functions such as () => {} are not supported in PhantomJS.');
                }
                return val.toString();
            }
            return val;
        });

        let promise = new Promise((res, rej) => {
            command.deferred = { resolve: res, reject: rej };
        });

        this.logger.debug('Sending: %s', json);

        this.process.stdin.write(json + _os2.default.EOL, 'utf8');

        return promise;
    }

    /**
     * Executes a command
     *
     * @param target target object to execute against
     * @param name the name of the method execute
     * @param args an array of args to pass to the method
     * @returns {Promise}
     */
    execute(target, name) {
        let args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

        return this.executeCommand(new _command2.default(null, target, name, args));
    }

    /**
     * Adds an event listener to a target object (currently only works on pages)
     *
     * @param event the event type
     * @param target target object to execute against
     * @param runOnPhantom would the callback run in phantomjs or not
     * @param callback the event callback
     * @param args an array of args to pass to the callback
     */
    on(event, target, runOnPhantom, callback) {
        let args = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

        const eventDescriptor = { type: event };

        if (runOnPhantom) {
            eventDescriptor.event = callback;
            eventDescriptor.args = args;
        } else {
            const emitter = this.getEmitterForTarget(target);
            emitter.on(event, function () {
                let params = [].slice.call(arguments).concat(args);
                return callback.apply(null, params);
            });
        }
        return this.execute(target, 'addEvent', [eventDescriptor]);
    }

    /**
     * Removes an event from a target object
     *
     * @param event
     * @param target
     */
    off(event, target) {
        const emitter = this.getEmitterForTarget(target);
        emitter.removeAllListeners(event);
        return this.execute(target, 'removeEvent', [{ type: event }]);
    }

    getEmitterForTarget(target) {
        let emitter = this.events.get(target);

        if (emitter == null) {
            emitter = new _events2.default();
            this.events.set(target, emitter);
        }

        return emitter;
    }

    /**
     * Cleans up and end the phantom process
     */
    exit() {
        clearInterval(this.heartBeatId);
        this.execute('phantom', 'invokeMethod', ['exit']);
    }

    /**
     * Clean up and force kill this process
     */
    kill() {
        let errmsg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Phantom process was killed';

        this._rejectAllCommands(errmsg);
        this.process.kill('SIGKILL');
    }

    _heartBeat() {
        if (this.commands.size === 0 && !this.isNoOpInProgress) {
            this.isNoOpInProgress = true;
            this.process.stdin.write(NOOP + _os2.default.EOL, 'utf8');
        }
    }

    /**
     * rejects all commands in this.commands
     */
    _rejectAllCommands() {
        let errmsg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Phantom exited prematurely';

        // prevent heartbeat from preventing this from terminating
        clearInterval(this.heartBeatId);
        for (const command of this.commands.values()) {
            if (command.deferred != null) {
                command.deferred.reject(new Error(errmsg));
            }
        }
    }
}
exports.default = Phantom;