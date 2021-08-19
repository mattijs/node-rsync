# Rsync ![build status](https://travis-ci.org/mattijs/node-rsync.svg?branch=master)

[![NPM](https://nodei.co/npm/rsync.png?downloads=true)](https://nodei.co/npm/rsync/)

`Rsync` is a class for building and executing `rsync` commands with Node.js.

## Requirements

Node.js v6 or newer.

## Installation

Installation goes through NPM:

```bash
npm install rsync
```

## Simple usage

```javascript
const rsync = require('rsync');

// Build the command
const cmd = rsync().shell('ssh')
  .setFlags('az')
  .source('/path/to/source')
  .destination('server:/path/to/destination');

// Execute the command

cmd.execute()
  .then(() => {
    console.log('All done executing', cmd);
  })
  .catch(err => {
    console.error(err);
  });
```

For more examples see the `examples` directory.

# API

* [constructor](#constructor)
* [instance methods](#instance-methods)
* [accessor methods](#accessor-methods)
* [static methods](#static-methods)

## constructor

Construct a new Rsync command instance. The constructor takes a single `options` object, with the following properties:

* `executable`: path to `rsync` executable (default: `rsync` found in `PATH`)
* `stdout`: custom stream for `stdout` output (default: `process.stdout`)
* `stderr`: custom stream for `stderr` output (default: `process.stderr`)
* `stdin`: custom stream for `stdin` input (default: `process.stdin`)

```javascript
const {Rsync} = require('rsync');
const cmd = new Rsync({
  executable: '/usr/local/bin/rsync',
  stdout: process.stdout,
  stderr: process.stderr,
  stdin: process.stdin
});
```

## instance methods

### set(option, value)

Set an option. This can be any option from the rsync manual. The value is optional and only applies to options that take a value. This is not checked however. Supplying a value for an option that does not take a value will append the value regardless. This may cause errors when the command is executed.

```javascript
cmd.set('a')
  .set('progress')
  .set('list-only')
  .set('exclude-from', '/path/to/exclude-file');
```

Options must be unique and setting the same option twice will override any existing value. For options that can be set multiple times special methods exist (see accessor methods). Any leading dashes (-) are stripped when setting the option.

The `set` method is chainable.

### unset(option)

Unset an option. Any leading dashes (-) are stripped when unsetting an option.

```javascript
cmd.unset('progress')
  .unset('quiet');
```

The `unset` method is chainable.

### setFlags(flags)

Set one or more flags. Flags are single letter options without a value, for example _compress_ (`-z`) or _archive_ (`-a`).

The following are equivalent:

```javascript
cmd.setFlags('avz');
cmd.setFlags('a', 'v', 'z');
cmd.setFlags(['a', 'v', 'z']);
cmd.setFlags(['avz']);
cmd.setFlags(['a', 'v'], ['z']);
```

The `setFlags` method is chainable. `flags` is an alias for `setFlags`.

### unsetFlags(flags)

Unset one or more flags. Flags are single letter options without a value, for example _compress_ (`-z`) or _archive_ (`-a`).

The following are equivalent:

```javascript
cmd.unsetFlags('avz');
cmd.unsetFlags('a', 'v', 'z');
cmd.unsetFlags(['a', 'v', 'z']);
cmd.unsetFlags(['avz']);
cmd.unsetFlags(['a', 'v'], ['z']);
```

The `unsetFlags` method is chainable.

### isSet(option)

Check if an option is set.

This method does not check alternate versions for an option. When an option is set as the short version this method will still return `false` when checking for the long version, event though they are the same option.

```javascript
cmd.set('quiet');
cmd.isSet('quiet'); // is TRUE
cmd.isSet('q');     // is FALSE
```

### option(option)

Get the value for an option by name. If a valueless option is requested null will be returned.

```javascript
cmd.option('rsh');      // returns String value
cmd.option('progress'); // returns NULL
```

### args()

Get the arguments list for the command that is going to be executed. Returns an Array with the complete options that will be passed to the command.

### command()

Get the complete command that is going to be executed.

```javascript
const cmd = rsync()
  .shell('ssh')
  .flags('az')
  .source('/p/t/source')
  .destination('server:/p/t/dest');

const c = cmd.command();
// c is "rsync -az --rsh="ssh" /p/t/source server:/p/t/dest
```

### cwd(path)

Set or get the value for rsync process cwd.

```javascript
cmd.cwd(__dirname); // Set cwd to __dirname
cmd.cwd(); // Get cwd value
```

### env(envObj)

Set or get the value for rsync process environment variables.

Default: process.env

```javascript
cmd.env(process.env); // Set env to process.env
cmd.env(); // Get env values
```

### output(stdoutHandler, stderrHandler)

Register output handler functions for the commands stdout and stderr output. The handlers will be
called with streaming data from the commands output when it is executed.

```javascript
cmd.output(
    function(data){
        // do things like parse progress
    }, function(data) {
        // do things like parse error output
    }
);
```

This method can be called with an array containing one or two functions. These functions will
be treated as the stdoutHandler and stderrHandler arguments. This makes it possible to register
handlers through the `Rsync.build` method by specifying the functions as an array.

```javascript
const cmd = Rsync.build({
    // ...
    output: [stdoutFunc, stderrFunc] // these are references to functions defined elsewhere
    // ...
});
```

### execute([options])

Execute the command.  `options` accepts two props, `stdoutHandler` and `stderrHandler`.

When `stdoutHandler` and `stderrHandler` functions are provided they will be used to stream
data from stdout and stderr directly without buffering. Any output handlers that were
defined previously will be overwritten.

```javascript
cmd.execute().then((exitCode) => {
  // Do something once the rsync is complete
}).catch((error) => {
  // Handle errors with spawning of the process
}); 

// execute with stream callbacks
cmd.execute({
  stdoutHandler: (stdoutHandle) => {
    // do things like parse progress
  }, 
  stderrHandler: (stderrHandle) => {
    // do things like parse error output
  }
});

```

## option shorthands

The following option shorthand methods are available:

* **shell(value)**: `--rsh=SHELL`
* **delete()**: `--delete`
* **progress()**: `--progress`
* **archive()**: `-a`
* **compress()**: `-z`
* **recursive()**: `-r`
* **update()**: `-u`
* **quiet()**: `-q`
* **dirs()**: `-d`
* **links()**: `-l`
* **dry()**: `-n`
* **chmod(value)**: `--chmod=VALUE` (accumulative)
* **hardLinks()**: `-H`
* **perms()**: `-p`
* **executability()**: `-E`
* **owner()**: `-o`
* **group()**: `-g`
* **acls()**: `-A`
* **xattrs()**: `-X`
* **devices()**: `--devices`
* **specials**: `--specials`
* **times()**: `-t`

All shorthand methods are chainable as long as options that require a value are provided with one.

## accessor methods

These methods can be used to get or set values in a chainable way. When the methods are called without arguments the current value is returned. When the methods are called with a value this will override the current value and the Rsync instance is returned to provide the chainability.

### executable(executable)

Get or set the executable to use as the rsync command.

### destination(destination)

Get or set the destination for the rsync command.

### source(source)

Get or set the source or sources for the rsync command. When this method is called multiple times with a value it is appended to the list of sources. It is also possible to present the list of source as an array where each value will be appended to the list of sources

```javascript
// chained
cmd.source('/a/path')
  .source('/b/path');

// as Array
cmd.source(['/a/path', '/b/path']);
```

In both cases the list of sources will contain two paths.

### patterns(patterns)

Register a list of file patterns to include/exclude in the transfer. Patterns can be registered as
an array of Strings or Objects.

When registering a pattern as a String it be prefixed with a `+` or `-` sign to
signal include or exclude for the pattern. The sign will be stripped of and the
pattern will be added to the ordered pattern list.

When registering the pattern as an Object it must contain the `action` and
`pattern` keys where `action` contains the `+` or `-` sign and the `pattern`
key contains the file pattern, without the `+` or `-` sign.

The order of patterns is important for some rsync commands. The patterns are stored in the order
they are added either through the `patterns` method or the `include` and `exclude` methods. The
`patterns` method can be used with `Rsync.build` to provide an ordered list for the command.

```javascript
// on an existing Rsync object
cmd.patterns([ '-.git', { action: '+', pattern: '/some_dir' });

// through Rsync.build
const command = Rsync.build({
    // ...
    patterns: [ '-.git', { action: '+', pattern: '/some_dir' } ]
    // ...
});
```

### exclude(pattern)

Exclude a pattern from transfer. When this method is called multiple times with a value it is
appended to the list of patterns. It is also possible to present the list of excluded
patterns as an array where each pattern will be appended to the list.

```javascript
// chained
cmd.exclude('.git')
  .exclude('.DS_Store');

// as Array
cmd.exclude(['.git', '.DS_Store']);
```

### include(pattern)

Include a pattern for transfer. When this method is called multiple times with a value it is
appended to the list of patterns. It is also possible to present the list of included patterns as
an array where each pattern will be appended to the list.

```javascript
// chained
cmd.include('/a/file')
  .include('/b/file');

// as Array
cmd.include(['/a/file', '/b/file']);
```

## static methods

### build

For convenience there is the `build` function on the Rsync contructor. This function can be
used to create a new Rsync command instance from an options object.

For each key in the options object the corresponding method on the Rsync instance will be
called. When a function for the key does not exist it is ignored. An existing Rsync instance
can optionally be provided.

```javascript
const {Rsync} = require('rsync');
const cmd = Rsync.build({
  source:      '/path/to/source',
  destination: 'server:/path/to/destination',
  exclude:     ['.git'],
  flags:       'avz',
  shell:       'ssh'
});

cmd.execute(function(error, stdout, stderr) {
  // we're done
});
```

## Differences between this and [rsync](https://npm.im/rsync)

* `execute()` returns a `Promise`
* Better handling of windows/unix cross platform compatibility
* Better escape of shell escape sequqences to prevent exploits
* `flags()` no longer can unset flags by passing a `false` final parameter. Use `unsetFlags()` instead.
* `setFlags()` is also available.
* Support for custom `STDOUT`, `STDERR` and `STDIN` streams
* Default export is `rsync()` function which wraps the constructor of the `Rsync` class; the `Rsync` class is now a property thereof:

  ```javascript
  const {Rsync} = require('rsync');
  const rsync = require('rsync');

  const a = rsync().setFlags('avz');
  const b = new Rsync().setFlags('avz');
  ```

## Development

If there is something missing (which there probably is) just fork, patch and send a pull request.

For adding a new shorthand method there are a few simple steps to take:

* Fork
* Add the option through the `exposeShortOption`, `exposeLongOption` or `exposeMultiOption` functions. For examples see the source file.
* Update this README file to list the new shorthand method
* Make a pull request

When adding a shorthand make sure it does not already exist, it is a sane name and a shorthand is necessary.

If there is something broken (which there probably is), the same applies: fork, patch, pull request. Opening an issue is also possible.

## Changelog

v2.0.0

* Forked to `@jhundley9109/rsync`

v1.0.0

* Forked to `@boneskull/rsync`

v0.6.1

* Add support for windows file paths under cygwin (#53)

v0.6.0

* Escape dollar signs in filenames (#40)
* Add permission shorthands (#46)
* Added env() option to set the process environment variables (#51)

v0.5.0

* Properly treat flags as String
* Differentiate between shell and file arguments (escaping)
* Added a bunch of unit tests
* Added TravisCI setup to run tests on branches and PRs
* Added cwd() option to set the process CWD (#36)

v0.4.0

* Child process pid is returned from `execute` (#27)
* Command execution shell is configurable for Unix systems (#27)
* Better escaping for filenames with spaces (#24)

v0.3.0

* Launch the command under a shell (#15)
* Typo fix isaArray -> isArray for issue (#14)
* Error: rsync exited with code 14 (#11)

v0.2.0

* use spawn instead of exec (#6)

v0.1.0

* better support for include/exclude filters
* better support for output handlers
* removed output buffering (#6)

v0.0.2

* swapped exclude and include order
* better shell escaping

v0.0.1

* initial version (actually the second)

## License

This module is licensed under the MIT License. See the `LICENSE` file for more details.
