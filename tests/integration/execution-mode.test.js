/*global describe,it,before,beforeEach,afterEach*/
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Rsync = require('../../rsync');

function compareTrees(source, destination) {
  const names = fs.readdirSync(source).sort();
  assert.deepStrictEqual(fs.readdirSync(destination).sort(), names,
    'Destination must contain exactly the source entries');

  let count = 0;
  for (const name of names) {
    const from = path.join(source, name);
    const to = path.join(destination, name);
    if (fs.lstatSync(from).isDirectory()) {
      assert(fs.lstatSync(to).isDirectory(), 'Expected directory: ' + to);
      count += compareTrees(from, to);
    } else {
      assert(fs.lstatSync(from).isFile(), 'Expected regular fixture file: ' + from);
      assert(fs.lstatSync(to).isFile(), 'Expected regular copied file: ' + to);
      assert.deepStrictEqual(fs.readFileSync(to), fs.readFileSync(from),
        'Copied bytes differ: ' + name);
      count++;
    }
  }
  return count;
}

describe('[integration] local rsync execution (execution-mode)', function() {
  this.timeout(10000);

  const source = path.join(__dirname, 'fixtures/source-data') + path.sep;
  let temporary;
  let destination;
  let rsync;
  let child;
  let childClosed;

  before(function() {
    const result = childProcess.spawnSync('rsync', ['--version'], { encoding: 'utf8' });
    assert.ifError(result.error);
    assert.strictEqual(result.status, 0,
      'Integration tests require a working rsync on PATH: ' + result.stderr);
  });

  beforeEach(function() {
    child = null;
    childClosed = false;
    temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'node-rsync integration '));
    destination = path.join(temporary, 'copied data') + path.sep;
    fs.mkdirSync(destination);
    rsync = new Rsync().flags('a').source(source).destination(destination);
  });

  afterEach(async function() {
    // On assertion failure or timeout, stop the child before removing its output.
    try {
      if (child && !childClosed) {
        await new Promise(function(resolve) {
          child.once('close', resolve);
          child.kill('SIGKILL');
        });
      }
    } finally {
      if (temporary) {
        fs.rmSync(temporary, { recursive: true, force: true });
        temporary = null;
      }
    }
  });

  function execute() {
    return new Promise(function(resolve, reject) {
      let stderr = '';
      child = rsync.execute(function(error, code) {
        if (error) {
          reject(new Error(error.message + '\n' + stderr));
        } else {
          resolve(code);
        }
      });
      child.once('close', function() { childClosed = true; });
      child.once('error', reject);
      child.stderr.on('data', function(chunk) { stderr += chunk; });
      child.stdout.resume();
    });
  }

  it('spawns rsync directly by default and copies files byte-for-byte', async function() {
    // Do not set executeInShell: exercise the secure default.
    assert.strictEqual(rsync.executeInShell(), false);
    const code = await execute();

    assert.strictEqual(code, 0, 'Copy must exit successfully');
    // Inspect the real child, with independently specified raw arguments.
    assert.strictEqual(child.spawnfile, 'rsync', 'Must spawn rsync, not a shell');
    assert.deepStrictEqual(child.spawnargs, ['rsync', '-a', source, destination]);
    assert(compareTrees(source, destination) > 0, 'Fixture tree must not be empty');
  });

  it('spawns a shell when explicitly enabled and copies files byte-for-byte', async function() {
    // Only trusted, local test paths are passed to the shell.
    rsync.executeInShell(true);
    assert.strictEqual(rsync.executeInShell(), true);
    const shell = process.platform === 'win32' ? 'cmd.exe' : rsync.executableShell();
    const args = process.platform === 'win32'
      ? ['/s', '/c', '"' + rsync.command() + '"']
      : ['-c', rsync.command()];
    const code = await execute();

    assert.strictEqual(code, 0, 'Copy must exit successfully');
    assert.strictEqual(child.spawnfile, shell, 'Must spawn the configured shell');
    assert.deepStrictEqual(child.spawnargs, [shell].concat(args));
    assert(compareTrees(source, destination) > 0, 'Fixture tree must not be empty');
  });
});
