var exec = require('child_process').exec;

/**
 * Rsync wrapper.
 *
 * @author      Mattijs Hoitink <mattijs@monkeyandmachine.com>
 * @copyright   Copyright (c) 2013, Mattijs Hoitink <mattijs@monkeyandmachine.com>
 * @license     The MIT License
 */
function Rsync(options) {
    // executable
    this._executable = 'rsync';

    // source(s) and destination
    this._sources     = [];
    this._destination = '';

    // included/excluded files
    this._includes = [];
    this._excludes = [];

    // options
    this._options = {};

    // internal debugging flag
    this._debug = false;
}

/**
 * Build a new Rsync command from an options Object.
 * @param {Object} options
 * @return {Rsync}
 */
Rsync.build = function(options) {
    var command = new Rsync();

    // Process all options
    for (var key in options) {
        if (hasOP(options, key)) {
            var value = options[key];

            // Only allow calling methods on the Rsync command
            if (typeof(command[key]) === 'function') {
                command[key](value);
            }
        }
    }

    return command;
};

/**
 * Set an option.
 * @param {String} option
 * @param mixed value
 * @return Rsync
 */
Rsync.prototype.set = function(option, value) {
    option = stripLeadingDashes(option);
    if (option && option.length > 0) {
        this._options[option] = value || null;
    }
    return this;
};

/**
 * Unset an option.
 * @param {String} option
 * @return Rsync
 */
Rsync.prototype.unset = function(option) {
    option = stripLeadingDashes(option);

    if (option && Object.keys(this._options).indexOf(option) >= 0) {
        delete this._options[option];
    }
    return this;
};

/**
 * Set or unset one or more flags. A flag is a single letter option without a value.
 *
 * Flags can be presented as a single String, an Array containing Strings or an Object
 * with the flags as keys.
 *
 * When flags are presented as a String or Array the set or unset method will be determined
 * by the second parameter.
 * When the flags are presented as an Object the set or unset method will be determined by
 * the value corresponding to each flag key.
 *
 * @param {String|Array|Object} flags
 * @param {Boolean} set
 * @return Rsync
 */
Rsync.prototype.flags = function(flags, set) {
    // Do some argument handling
    if (!arguments.length) {
        return this;
    }
    else if (arguments.length === 1) {
        set = true;
    }
    else {
        // There are more than 1 arguments, assume flags are presented as strings
        flags = Array.prototype.slice.call(arguments);

        // Check if the last argument is a boolean
        if (typeof(flags[flags.length - 1]) === 'boolean') {
            set = flags.pop();
        }
        else {
            set = true;
        }
    }

    // Split multiple flags
    if (typeof(flags) === 'string') {
        flags = stripLeadingDashes(flags).split('');
    }

    // Turn array into an object
    if (isArray(flags)) {
        var obj = {};
        flags.forEach(function(f) {
            obj[f] = set;
        });
        flags = obj;
    }

    // set/unset each flag
    for (var key in flags) {
        if (hasOP(flags, key)) {
            var method = (flags[key]) ? 'set' : 'unset';
            this[method](stripLeadingDashes(key));
        }
    }

    return this;
};

/**
 * Check if an option is set.
 * @param {String} option
 * @return {Boolean}
 */
Rsync.prototype.isSet = function(option) {
    option = stripLeadingDashes(option);
    return Object.keys(this._options).indexOf(option) >= 0;
};

/**
 * Get an option by name.
 * @param {String} name
 * @return mixed
 */
Rsync.prototype.option = function(name) {
    return this._options[name];
};

/**
 * Get the command that is going to be executed.
 * @return {String}
 */
Rsync.prototype.command = function() {
    return this.executable() + ' ' + this.args().join(' ');
};

/**
 * String representation of the Rsync command. This is the command that is
 * going to be executed when calling Rsync::execute.
 * @return {String}
 */
Rsync.prototype.toString = Rsync.prototype.command;

/**
 * Get the arguments for the rsync command.
 * @return {Array}
 */
Rsync.prototype.args = function() {
    // Gathered arguments
    var args = [];

    // Add options. Short options (one letter) without values are gathered together.
    // Long options have a value but can also be a single letter.
    var short = [];
    var long  = [];

    // Split long and short options
    for (var key in this._options) {
        if (hasOP(this._options, key)) {
            var value = this._options[key];
            var noval = (value === null || value === undefined);

            // Check for short option (single letter without value)
            if (key.length === 1 && noval) {
                short.push(key);
            }
            else {
                long.push(buildOption(key, value));
            }

        }
    }

    // Add short options if any are present
    if (short.length > 0) args.push('-' + short.join(''));

    // Add long options if any are present
    if (long.length > 0)  args.push(long.join(' '));

    // Add includes.
    if (this._includes.length > 0) {
        args.push(this._includes.map(function(pattern) {
            return buildOption('include', pattern);
        }).join(' '));
    }

    // Add excludes
    if (this._excludes.length > 0) {
        args.push(this._excludes.map(function(pattern) {
            return buildOption('exclude', pattern);
        }).join(' '));
    }

    // Add source(s) and destination
    args.push(
        this.source().join(' '),
        this.destination()
    );

    return args;
};

/**
 * Execute the rsync command.
 * @param {Function} callback
 */
Rsync.prototype.execute = function(callback) {
    // Execute the command in a subshell
    var cmd  = this.command();

    // output buffers
    var stdoutBuffer = '',
        stderrBuffer = '';

    // Execute the command and wait for it to finish
    var command = exec(cmd);

    // capture stdout and stderr
    command.stdout.on('data', function(chunk) { stdoutBuffer += chunk; });
    command.stderr.on('data', function(chunk) { stderrBuffer += chunk; });

    command.on('exit', function(code) {
        var error = null;

        // Check rsyncs error code
        // @see http://bluebones.net/2007/06/rsync-exit-codes/
        if (code !== 0) {
            error = new Error('rsync exited with code ' + code);
        }

        // Check for callback
        if (typeof(callback) === 'function') {
            callback(error, stdoutBuffer, stderrBuffer, cmd);
        }
    });
};

createValueAccessor('debug');
createValueAccessor('executable');
createValueAccessor('destination');

createListAccessor('source', '_sources');
createListAccessor('exclude', '_excludes');
createListAccessor('include', '_includes');

exposeLongOption('rsh', 'shell');

exposeShortOption('progress');
exposeShortOption('a', 'archive');
exposeShortOption('z', 'compress');
exposeShortOption('r', 'recursive');
exposeShortOption('u', 'update');
exposeShortOption('q', 'quiet');
exposeShortOption('d', 'dirs');
exposeShortOption('l', 'links');
exposeShortOption('n', 'dry');

// our awesome export products
module.exports = Rsync;

/* **** */

/**
 * Create a chainable function on the Rsync prototype for getting and setting an
 * internal value.
 * @param {String} name
 * @param {String} internal
 */
function createValueAccessor(name, internal) {
    var container = internal || '_' + name;

    Rsync.prototype[name] = function(value) {
        if (!arguments.length) return this[container];
        this[container] = value;
        return this;
    };
}

/**
 * @param {String} name
 * @param {String} internal
 */
function createListAccessor(name, internal) {
    var container = internal || '_' + name;

    Rsync.prototype[name] = function(value) {
        if (!arguments.length) return this[container];

        if (isArray(value)) {
            value.forEach(this[name], this);
        }
        else if (typeof(value) !== 'string') {
            throw new Error('Value for Rsync::' + name + ' must be a String');
        }
        else if (this[container].indexOf(value) < 0) {
            this[container].push(value);
        }

        return this;
    };
}

/**
 * Create a shorthand method on the Rsync prototype for setting and unsetting a simple option.
 * @param {String} option
 * @param {String} name
 */
function exposeShortOption(option, name) {
    name = name || option;

    Rsync.prototype[name] = function(set) {
        // When no arguments are passed in assume the option
        // needs to be set
        if (!arguments.length) set = true;

        var method = (set) ? 'set' : 'unset';
        return this[method](option);
    };
}

/**
 * Expose an rsync long option on the Rsync prototype.
 * @param {String} option   The option to expose
 * @param {String} name     An optional alternative name for the option.
 */
function exposeLongOption(option, name) {
    name = name || option;

    Rsync.prototype[name] = function(value) {
        // When not arguments are passed in assume the options
        // current value is requested
        if (!arguments.length) return this.option(option);

        var method = (value) ? 'set' : 'unset';
        return this[method](option, value);
    };
}

/**
 * Build an option for use in a shell command.
 * @param {String} name
 * @param {String} vlaue
 * @return {String}
 */
function buildOption(name, value) {
    var single = (name.length === 1) ? true : false;

    // Decide on prefix and value glue
    var prefix = (single) ? '-' : '--';
    var glue   = (single) ? ' ' : '=';

    // Build the option
    var option = prefix + name;
    if (arguments.length > 1 && value) {
        if (name === 'rsh') {
            option += glue + '"' + String(value) + '"'
        } else {
            option += glue + escapeShellArg(String(value));
        }
    }

    return option;
}

/**
 * Escape an argument for use in a shell command.
 * @param {String} arg
 * @return {String}
 */
function escapeShellArg(arg) {
  return '"' + arg.replace(/(["'`\\])/g, '\\$1') + '"';
}

/**
 * Strip the leading dashes from a value.
 * @param {String} value
 * @return {String}
 */
function stripLeadingDashes(value) {
    if (typeof(value) === 'string') {
        value = value.replace(/^[\-]*/, '');
    }

    return value;
}

/**
 * Simple method for capturing output in a String
 * @param {ReadableStream} stream
 * @param {String} buffer
 */
function captureOutput(stream, buffer) {
    stream.on('data', function(chunk) {
        buffer += chunk;
    });
}

/**
 * Simple function for checking if a value is an Array. Will use the native
 * Array.isArray method if available.
 * @param {Mixed} value
 * @return {Boolean}
 */
function isArray(value) {
    if (typeof(Array.isArray) === 'function') {
        return Array.isArray(value);
    }
    else {
        return toString.call(value) == '[object Array]';
    }
}

/**
 * Simple hasOwnProperty wrapper. This will call hasOwnProperty on the obj
 * through the Object prototype.
 * @param {Object} obj  The object to check the property on
 * @param {String} key  The name of the property to check
 * @return {Boolean}
 */
function hasOP(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
