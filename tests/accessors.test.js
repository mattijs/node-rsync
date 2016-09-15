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

      it('should set the current directory for rsync', function () {
        var rsync = Rsync.build({
          'source':           'a.txt',
          'destination':      'b.txt',
          'cwd':  __dirname + '/..'
        });

        assert.equal(path.resolve(__dirname, '..'), rsync.cwd(), 'cwd was set');
      });

    });

    describe('#owner', function () {

      it('should set the owner name for synced files', function () {
        var rsync = Rsync.build({
          'source':           'a.txt',
          'destination':      'b.txt',
        });

        rsync.set('owner', 'root');

        assert.equal('root', rsync.option('owner'), 'owner was set');
      });

    });

    describe('#group', function () {

      it('should set the group name for synced files', function () {
          var rsync = Rsync.build({
            'source':           'a.txt',
            'destination':      'b.txt',
          });

          rsync.set('group', 'sudoers');

          assert.equal('sudoers', rsync.option('group'), 'group was set');
      });

    });

});
