/*global describe,it*/
'use strict';
var Rsync = require('../rsync');
var assert = require('chai').assert;
var assertOutput = require('./helpers/output').assertOutput;
var path = require('path');


describe('accessors', function () {

    describe('#executable', function () {

      it('should set the executable to use', function () {
        var rsync = Rsync.build({
          'source':      'a.txt',
          'destination': 'b.txt',
          'executable':  '/usr/local/bin/rsync'
        });

        assert.equal('/usr/local/bin/rsync', rsync.executable(), 'executable was set');
        assertOutput(rsync, '/usr/local/bin/rsync a.txt b.txt');
      });

    });

    describe('#executableShell', function () {

      it('should set the the executable shell to use', function () {
        var rsync = Rsync.build({
          'source':           'a.txt',
          'destination':      'b.txt',
          'executableShell':  '/bin/zsh'
        });

        assert.equal('/bin/zsh', rsync.executableShell(), 'executableShell was set');
      });

    });

    describe('#cwd', function () {

      it('should set the the cwd to use', function () {
        var rsync = Rsync.build({
          'source':           'a.txt',
          'destination':      'b.txt',
          'cwd':  __dirname + '/..'
        });

        assert.equal(path.resolve(__dirname, '..'), rsync.cwd(), 'cwd was set');
      });

    });

    describe('#env', function () {

      it('should set the the env variables to use', function () {
        var rsync = Rsync.build({
          'source':           'a.txt',
          'destination':      'b.txt',
          'env': {'red': 'blue'}
        });

        assert.equal('blue', rsync.env().red, 'env was set');
      });

    });

});
