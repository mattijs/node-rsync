'use strict';

const spawn = require('cross-spawn');
const path = require('path');
const which = require('which').sync;
const unixify = require('unixify');

/**
 * Rsync is a wrapper class to configure and execute an `rsync` command
 * in a fluent and convenient way.
 *
 * A new command can be set up by creating a new `Rsync` instance of
 * obtaining one through the `build` method.
 *
 * @example
 *   // using the constructor
 *   var rsync = new Rsync()
 *       .source('/path/to/source')
 *       .destination('myserver:destination/');
 *
 *   // using the build method with options
 *   var rsync = Rsync.build({
 *     source:      '/path/to/source',
 *     destination: 'myserver:destination/'
 *   });
 *
 * Executing the command can be done using the `execute` method. The command
 * is executed as a child process and three callbacks can be registered. See
 * the `execute` method for more details.
 *
 * @example
 *   rsync.execute((error, code, cmd) => {
 *     // function called when the child process is finished
 *   }, stdoutChunk => {
 *     // function called when a chunk of text is received on stdout
 *   }, stderrChunk => {
 *     // function called when a chunk of text is received on stderr
 *   });
 *
 * @author      Mattijs Hoitink <mattijs@monkeyandmachine.com>
 * @copyright   Copyright (c) 2013, Mattijs Hoitink
 *   <mattijs@monkeyandmachine.com>
 * @license     The MIT License
 *
 * @constructor
 * @param {Object} config Configuration settings for the Rsync wrapper.
 */
class Rsync {
  constructor ({ executable = which('rsync'), stderr = process.stderr, stdout = process.stdout, stdin = process.stdin } = {}) {
    // executable
    this._executable = executable;

    // source(s) and destination
    this._sources = [];
    this._destination = '';

    // ordered list of file patterns to include/exclude
    this._patterns = [];

    // options
    this._options = new Proxy(Object.create(null), {
      get (target, prop) {
        prop = stripLeadingDashes(prop);
        return target[prop];
      },
      set (target, prop, value) {
        prop = stripLeadingDashes(prop);
        target[prop] = value;
        return true;
      },
      deleteProperty (target, prop) {
        prop = stripLeadingDashes(prop);
        delete target[prop];
        return true;
      },
      has (target, prop) {
        prop = stripLeadingDashes(prop);
        return prop in target;
      }
    });

    // output callbacks
    this._outputHandlers = {
      stdout: noop,
      stderr: noop
    };

    this._cwd = process.cwd();

    // Allow child_process.spawn env overriding
    this._env = process.env;

    this._stderr = stderr;
    this._stdout = stdout;
    this._stdin = stdin;
  }

  /**
   * Set an option.
   * @param {string} option - Option name
   * @param {*} [value] - Whatever value
   * @return {Rsync}
   */
  set (option, value) {
    this._options[option] = value;
    return this;
  }

  /**
   * Unset an option.
   * @param {string} option - Option name
   * @return {Rsync}
   */
  unset (option) {
    if (option) {
      delete this._options[option];
    }
    return this;
  }

  /**
   * Sets an Array of flags or a string of flags to `true`
   * @param {string|...string|string[]|...string[]} flags - Flags to set to
   *   `true`
   * @returns {Rsync}
   * @example
   * rsync.setFlags('avz')
   * // equivalent to:
   * rsync.setFlags(['a', 'v', 'z'])
   * // and:
   * rsync.setFlags('a', 'v', 'z')
   */
  setFlags (...flags) {
    parseFlags(...flags).forEach(flag => {
      this.set(flag);
    });
    return this;
  }

  /**
   * Sets an Array of flags or a string of flags to `false`
   * @param {string|...string|string[]|...string[]} flags - Flags to set to
   *   `false`
   * @returns {Rsync}
   * @example
   * rsync.unsetFlags('avz')
   * // equivalent to:
   * rsync.unsetFlags(['a', 'v', 'z'])
   * // and:
   * rsync.unsetFlags('a', 'v', 'z')
   */
  unsetFlags (...flags) {
    parseFlags(...flags).forEach(flag => {
      this.unset(flag);
    });
    return this;
  }

  /**
   * Check if an option is set.
   * @param {string} option
   * @return {boolean}
   */
  isSet (option) {
    return option in this._options;
  }

  /**
   * Get an option by name.
   * @param {string} name - Option name
   * @return {*}
   */
  option (name) {
    return this._options[name];
  }

  /**
   * Register a list of file patterns to include/exclude in the transfer.
   * Patterns can be registered as an array of Strings or Objects.
   *
   * When registering a pattern as a string it must be prefixed with a `+` or
   * `-` sign to signal include or exclude for the pattern. The sign will be
   * stripped of and the pattern will be added to the ordered pattern list.
   *
   * When registering the pattern as an Object it must contain the `action` and
   * `pattern` keys where `action` contains the `+` or `-` sign and the
   * `pattern` key contains the file pattern, without the `+` or `-` sign.
   *
   * @example
   *   // on an existing rsync object
   *   rsync.patterns(['-docs', { action: '+', pattern: '/subdir/*.py' }]);
   *
   *   // using Rsync.build for a new rsync object
   *   rsync = Rsync.build({
   *     ...
   *     patterns: [ '-docs', { action: '+', pattern: '/subdir/*.py' }]
   *     ...
   *   })
   *
   * @param {Array} patterns
   * @return {Rsync}
   */
  patterns (...patterns) {
    patterns.forEach(pattern => {
      if (Array.isArray(pattern)) {
        return this.patterns(...pattern);
      }
      let action = '?';
      if (typeof pattern === 'string') {
        action = pattern.charAt(0);
        pattern = pattern.substring(1);
      } else if (typeof pattern === 'object' && 'action' in pattern &&
        'pattern' in pattern) {
        action = pattern.action;
        pattern = pattern.pattern;
      }

      // Check if the pattern is an include or exclude
      if (action === '-') {
        this.exclude(pattern);
      } else {
        this.include(pattern);
      }
    });

    return this;
  }

  /**
   * Exclude a file pattern from transfer. The pattern will be appended to the
   * ordered list of patterns for the rsync command.
   *
   * @param {...string|...string[]} patterns
   * @return {Rsync}
   */
  exclude (...patterns) {
    patterns.forEach(pattern => {
      if (Array.isArray(pattern)) {
        return this.exclude(...pattern);
      }
      this._patterns.push({
        action: '-',
        pattern
      });
    });
    return this;
  }

  /**
   * Include a file pattern for transfer. The pattern will be appended to the
   * ordered list of patterns for the rsync command.
   *
   * @param {string|Array} patterns
   * @return {Rsync}
   */
  include (...patterns) {
    patterns.forEach(pattern => {
      if (Array.isArray(pattern)) {
        return this.include(...pattern);
      }
      this._patterns.push({
        action: '+',
        pattern
      });
    });

    return this;
  }

  /**
   * Get the command that is going to be executed.
   * @return {string}
   */
  command () {
    return `${this.executable()} ${this.args().join(' ')}`;
  }

  /**
   * Get the arguments for the rsync command.
   * @return {Array}
   */
  args () {
    // Gathered arguments
    let args = [];

    // Add options. Short options (one letter) without values are gathered
    // together. Long options have a value but can also be a single letter.
    let short = [];
    let long = [];

    // Split long and short options
    Object.keys(this._options).forEach(key => {
      const value = this._options[key];
      if (key.length === 1 && typeof value === 'undefined') {
        short = short.concat(key);
      } else {
        long =
          Array.isArray(value)
            ? long.concat(value.map(
              val => buildOption(key, val, escapeShellArg)))
            : long.concat(
              buildOption(key, value, escapeShellArg));
      }
    });

    // Add combined short options if any are present
    if (short.length) {
      args = args.concat(`-${short.join('')}`);
    }

    // Add long options if any are present
    if (long.length) {
      args = args.concat(long);
    }

    // Add includes/excludes in order
    args =
      args.concat(this._patterns.map(({ action, pattern }) => buildOption(action ===
      '-'
        ? 'exclude'
        : 'include', pattern)));

    // Add sources
    if (this.source().length) {
      args = args.concat(this.source().map(source => unixify(source, false)));
    }

    // Add destination
    if (this.destination()) {
      args = args.concat(unixify(this.destination(), false));
    }

    return args;
  }

  /**
   * Get and set rsync process cwd directory.
   *
   * @param {string} [cwd] Directory path relative to current process directory.
   * @return {string} Return current _cwd.
   */
  cwd (cwd) {
    if (cwd) {
      this._cwd = path.posix.resolve(cwd);
    }
    return this._cwd;
  }

  /**
   * Get and set rsync process environment variables
   *
   * @param  {string} [env] Environment variables
   * @return {string} Return current _env.
   */
  env (env) {
    if (env) {
      this._env = env;
    }
    return this._env;
  }

  /**
   * Register an output handlers for the commands stdout and stderr streams.
   * These functions will be called once data is streamed on one of the output
   * buffers when the command is executed using `execute`.
   *
   * Only one callback function can be registered for each output stream.
   * Previously registered callbacks will be overridden.
   *
   * @param {Function} stdout - Callback Function for stdout `data` event
   * @param {Function} stderr - Callback Function for stderr `data` event
   * @return {Rsync}
   */
  output (stdout, stderr) {
    // Check for single argument so the method can be used with Rsync.build
    if (arguments.length === 1 && Array.isArray(stdout)) {
      [stderr, stdout] = stdout;
    }

    if (typeof stdout === 'function') {
      this._outputHandlers.stdout = stdout;
    }
    if (typeof stderr === 'function') {
      this._outputHandlers.stderr = stdout;
    }

    return this;
  }

  /**
   * Execute the rsync command.
   *
   * The callback function is called with an Error object (or null when there
   * was none), the exit code from the executed command and the executed
   * command as a string.
   *
   * When stdoutHandler and stderrHandler functions are provided they will be
   * used to stream data from stdout and stderr directly without buffering.
   *
   * @param {Object} [opts] Options
   * @param {Function} [opts.stdoutHandler] Called on each chunk received from
   *   stdout
   * @param {Function} [opts.stderrHandler] - Called on each chunk received from
   *   stdout
   * @param {Function} [callback] - Node-style callback.  If present, return the
   *   `ChildProcess` object, otherwise return a `Promise`.
   * @returns {Promise<void>|ChildProcess}
   */
  execute (opts = {}) {

    // Register output handlers
    this.output(
      opts.stdoutHandler || this._outputHandlers.stdout,
      opts.stderrHandler || this._outputHandlers.stderr
    );

    const promise = new Promise((resolve, reject) => {
      // use shell: true because spawn screws up quotes without it
      const cmdProc = spawn(this.executable(), this.args(), {
        cwd: this._cwd,
        env: this._env,
        shell: true
      });

      cmdProc.stdout.on('data', this._outputHandlers.stdout);
      cmdProc.stderr.on('data', this._outputHandlers.stderr);

      cmdProc.on('error', reject);
      cmdProc.on('close', code => {
        if (code) {
          return reject(new Error(`rsync exited with code ${code}`));
        }

        resolve(code);
      });
    }).catch(err => {
      return Promise.reject(err);
    });

    return promise;
  }

  /**
   * @deprecated
   */
  // flags () {
  //   throw new Error('flags() is deprecated; use setFlags() or unsetFlags() instead');
  // }

  flags(flags) {
    this.setFlags(flags);
  }
}

/**
 * Build a new Rsync command from an options Object.
 * @param {Object} options
 * @return {Rsync}
 */
Rsync.build = options => {
  const command = new Rsync();

  // Process all options
  Object.keys(options).forEach(key => {
    const value = options[key];
    if (typeof command[key] === 'function') {
      command[key](value);
    }
  });

  return command;
};

/**
 * string representation of the Rsync command. This is the command that is
 * going to be executed when calling Rsync::execute.
 * @return {string}
 */
Rsync.prototype.toString = Rsync.prototype.command;

/* **** */

/**
 * Create a chainable function on the Rsync prototype for getting and setting an
 * internal value.
 * @param {string} name
 * @param {string} [internal=false]
 */
const createValueAccessor = (name, internal = false) => {
  const container = internal || `_${name}`;

  Rsync.prototype[name] = function (value) {
    if (!arguments.length) {
      return this[container];
    }
    this[container] = value;
    return this;
  };
};

/**
 * @param {string} name
 * @param {string} internal
 */
const createListAccessor = (name, internal) => {
  const container = internal || `_${name}`;

  Rsync.prototype[name] = function (value) {
    if (!arguments.length) {
      return this[container];
    }

    if (Array.isArray(value)) {
      value.forEach(this[name], this);
    } else if (typeof value !== 'string') {
      throw new Error(`Value for Rsync::${name} must be a String`);
    } else if (this[container].indexOf(value) < 0) {
      this[container].push(value);
    }

    return this;
  };
};

/**
 * Create a shorthand method on the Rsync prototype for setting and unsetting a
 * simple option.
 * @param {string} option
 * @param {string} [name]
 */
const exposeShortOption = (option, name) => {
  name = name || option;

  Rsync.prototype[name] = function (set = true) {
    return this[set ? 'set' : 'unset'](option);
  };
};

/**
 * Create a function for an option that can be set multiple time. The option
 * will accumulate all values.
 *
 * @param {string} option
 * @param {[string]} name
 */
const exposeMultiOption = (option, name) => {
  name = name || option;

  Rsync.prototype[name] = function (value) {
    // When not arguments are passed in assume the options
    // current value is requested
    if (!arguments.length) {
      return this.option(option);
    }

    if (!value) {
      // Unset the option on falsy
      this.unset(option);
    } else if (Array.isArray(value)) {
      // Call this method for each array value
      value.forEach(this[name], this);
    } else {
      // Add the value
      const current = this.option(option);
      if (!current) {
        value = [value];
      } else if (!Array.isArray(current)) {
        value = [current, value];
      } else {
        value = current.concat(value);
      }

      this.set(option, value);
    }

    return this;
  };
};

/**
 * Expose an rsync long option on the Rsync prototype.
 * @param {string} option   The option to expose
 * @param {string} name     An optional alternative name for the option.
 */
const exposeLongOption = (option, name) => {
  name = name || option;

  Rsync.prototype[name] = function (value) {
    // When not arguments are passed in assume the options
    // current value is requested
    if (!arguments.length) {
      return this.option(option);
    }

    return this[value ? 'set' : 'unset'](option, value);
  };
};

/**
 * Build an option for use in a shell command.
 *
 * @param {string} name
 * @param {string} value
 * @param {Function|boolean} escapeArg
 * @return {string}
 */
const buildOption = (name, value, escapeArg) => {
  if (typeof escapeArg === 'boolean') {
    escapeArg = escapeArg ? null : noop;
  }

  if (typeof escapeArg !== 'function') {
    escapeArg = escapeShellArg;
  }

  // Detect single option key
  const single = name.length === 1;

  // Decide on prefix and value glue
  const prefix = single ? '-' : '--';
  const glue = single ? ' ' : '=';

  // Build the option
  let option = prefix + name;
  if (name && value) {
    value = escapeArg(String(value));
    option += glue + value;
  }
  // if (arguments.length > 1 && value) {
  //   value = escapeArg(String(value));
  //   option += glue + value;
  // }

  return option;
};

/**
 * Escape an argument for use in a shell command when necessary.
 * @param {string} arg
 * @return {string}
 */
const escapeShellArg = arg => {
  if (!/(["'`\\$ ])/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/(["'`\\$])/g, '\\$1')}"`;
};

/**
 * Strip the leading dashes from a value.
 * @param {string} value
 * @return {string}
 */
const stripLeadingDashes = value => {
  if (typeof value === 'string') {
    value = value.replace(/^[-]*/, '');
  }

  return value;
};

const noop = _ => {
};

const parseFlags = (...flags) => flags.reduce((acc, flag) => acc.concat(typeof (
  flag
) === 'string'
  ? flag.split('')
  : parseFlags(...flag)), []);

/**
 * Set a custom writable stream for stdout
 * @function
 * @name stdout
 * @memberOf Rsync.prototype
 * @param {stream.Writable|stream.Duplex} stream - New stdout
 * @return {Rsync|stream.Writable|stream.Duplex}
 */
createValueAccessor('stdout');

/**
 * Set a custom writable stream for stderr
 * @function
 * @name stderr
 * @memberOf Rsync.prototype
 * @param {stream.Writable|stream.Duplex} stream - New stderr
 * @return {Rsync|stream.Writable|stream.Duplex}
 */
createValueAccessor('stderr');

/**
 * Set a custom readable stream for stdout
 * @function
 * @name stdin
 * @memberOf Rsync.prototype
 * @param {stream.Readable|stream.Duplex} stream - New stdin
 * @return {Rsync|stream.Readable|stream.Duplex}
 */
createValueAccessor('stdin');

/**
 * Get or set the executable to use for the rsync process.
 *
 * When setting the executable path the Rsync instance is returned for
 * the fluent interface. Otherwise the configured executable path
 * is returned.
 *
 * @function
 * @name executable
 * @memberOf Rsync.prototype
 * @param {string} executable path to the executable (optional)
 * @return {Rsync|string}
 */
createValueAccessor('executable');

/**
 * Get or set the destination for the transfer.
 *
 * When setting the destination the Rsync instance is returned for
 * the fluent interface. Otherwise the configured destination path
 * is returned.
 *
 * @function
 * @name destination
 * @memberOf Rsync.prototype
 * @param {string} destination the destination (optional)
 * @return {Rsync|string}
 */
createValueAccessor('destination');

/**
 * Add one or more sources for the command or get the list of configured
 * sources.
 *
 * The sources are appended to the list of known sources if they were not
 * included yet and the Rsync instance is returned for the fluent
 * interface. Otherwise the configured list of source is returned.
 *
 * @function
 * @name source
 * @memberOf Rsync.prototype
 * @param {string|Array} sources the source or list of sources to configure
 *   (optional)
 * @return {Rsync|Array}
 */
createListAccessor('source', '_sources');

/**
 * Set the shell to use when logging in on a remote server.
 *
 * This is the same as setting the `rsh` option.
 *
 * @function
 * @name shell
 * @memberOf Rsync.prototype
 * @param {string} shell the shell option to use
 * @return {Rsync}
 */
exposeLongOption('rsh', 'shell');

/**
 * Add a chmod instruction to the command.
 *
 * @function
 * @name chmod
 * @memberOf Rsync.prototype
 * @param {string|Array}
 * @return {Rsync|Array}
 */
exposeMultiOption('chmod', 'chmod');

/**
 * Set the delete flag.
 *
 * This is the same as setting the `--delete` commandline flag.
 *
 * @function
 * @name delete
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('delete');

/**
 * Set the progress flag.
 *
 * This is the same as setting the `--progress` commandline flag.
 *
 * @function
 * @name progress
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('progress');

/**
 * Set the archive flag.
 *
 * @function
 * @name archive
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('a', 'archive');

/**
 * Set the compress flag.
 *
 * @function
 * @name compress
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('z', 'compress');

/**
 * Set the recursive flag.
 *
 * @function
 * @name recursive
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('r', 'recursive');

/**
 * Set the update flag.
 *
 * @function
 * @name update
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('u', 'update');

/**
 * Set the quiet flag.
 *
 * @function
 * @name quiet
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('q', 'quiet');

/**
 * Set the dirs flag.
 *
 * @function
 * @name dirs
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('d', 'dirs');

/**
 * Set the links flag.
 *
 * @function
 * @name links
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('l', 'links');

/**
 * Set the dry flag.
 *
 * @function
 * @name dry
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('n', 'dry');

/**
 * Set the hard links flag preserving hard links for the files transmitted.
 *
 * @function
 * @name hardLinks
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('H', 'hardLinks');

/**
 * Set the perms flag.
 *
 * @function
 * @name perms
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('p', 'perms');

/**
 * Set the executability flag to preserve executability for the files
 * transmitted.
 *
 * @function
 * @name executability
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('E', 'executability');

/**
 * Set the group flag to preserve the group permissions of the files
 * transmitted.
 *
 * @function
 * @name group
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('g', 'group');

/**
 * Set the owner flag to preserve the owner of the files transmitted.
 *
 * @function
 * @name owner
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('o', 'owner');

/**
 * Set the acls flag to preserve the ACLs for the files transmitted.
 *
 * @function
 * @name acls
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('A', 'acls');

/**
 * Set the xattrs flag to preserve the extended attributes for the files
 * transmitted.
 *
 * @function
 * @name xattrs
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('X', 'xattrs');

/**
 * Set the devices flag to preserve device files in the transfer.
 *
 * @function
 * @name devices
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('devices');

/**
 * Set the specials flag to preserve special files.
 *
 * @function
 * @name specials
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('specials');

/**
 * Set the times flag to preserve times for the files in the transfer.
 *
 * @function
 * @name times
 * @memberOf Rsync.prototype
 * @return {Rsync}
 */
exposeShortOption('t', 'times');

// our awesome export product
const rsync = (...args) => {
  return new Rsync(...args);
};

module.exports = rsync;
module.exports.Rsync = Rsync;
