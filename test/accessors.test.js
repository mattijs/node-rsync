/* eslint-env mocha */
'use strict';
const { Rsync } = require('../index');
const assert = require('chai').assert;
const assertOutput = require('./helpers/output').assertOutput;
const path = require('path');

describe('accessors', function () {
  describe('#executable', function () {
    it('should set the executable to use', function () {
      const rsync = Rsync.build({
        source: 'a.txt',
        destination: 'b.txt',
        executable: '/usr/local/bin/rsync'
      });

      assert.equal('/usr/local/bin/rsync',
        rsync.executable(),
        'executable was set');

      assertOutput(rsync, 'a.txt b.txt');
    });
  });

  describe('#cwd', function () {
    it('should set the the cwd to use', function () {
      const rsync = Rsync.build({
        source: 'a.txt',
        destination: 'b.txt',
        cwd: `${__dirname}/..`
      });

      assert.equal(path.resolve(__dirname, '..'), rsync.cwd(), 'cwd was set');
    });
  });

  describe('#env', function () {
    it('should set the the env variables to use', function () {
      const rsync = Rsync.build({
        source: 'a.txt',
        destination: 'b.txt',
        env: { red: 'blue' }
      });

      assert.equal('blue', rsync.env().red, 'env was set');
    });
  });
});
