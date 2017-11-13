/* eslint-env mocha */
'use strict';
const assert = require('chai').assert;
const assertOutput = require('./helpers/output').assertOutput;

const {Rsync} = require('../index');

describe('filters', function () {
  let command;

  beforeEach(() => {
    command = Rsync.build({
      'source': 'SOURCE',
      'destination': 'DESTINATION'
    });
  });

  describe('#patterns', function () {
    it('should interpret the first character', function () {
      command.patterns(['-.git', '+/tests/*.test.js']);
      assert.lengthOf(command._patterns, 2);
    });

    it('should be able to be set as an Object', function () {
      command.patterns([{
        'action': '+',
        'pattern': '.git'
      }, {
        'action': '-',
        'pattern': '/tests/*.test'
      }]);
      assert.lengthOf(command._patterns, 2);
    });

    it('should assume "include" for unknown patterns', function () {
      command.patterns(['*invalid']);
      assert.lengthOf(command._patterns, 1);
    });

    it('should add patterns to output in order added', function () {
      command.patterns([{
        'action': '-',
        'pattern': '.git'
      }, {
        'action': '+',
        'pattern': '/tests/*.test.js'
      }, '-build/*']);
      assertOutput(command,
        '--exclude=.git --include=/tests/*.test.js --exclude=build/* SOURCE DESTINATION');
    });
  });

  describe('#exclude', function () {
    it('should accept patterns as arguments', function () {
      command.exclude('.git', '.out');
      assert.lengthOf(command._patterns, 2);
    });

    it('should accept patterns as an Array', function () {
      command.exclude(['.build', 'docs']);
      assert.lengthOf(command._patterns, 2);
    });

    it('should add patterns to output in order added', function () {
      command.exclude('.git', 'docs', '/tests/*.test.js');
      assertOutput(command,
        '--exclude=.git --exclude=docs --exclude=/tests/*.test.js SOURCE DESTINATION');
    });
  });

  describe('#include', function () {
    it('should accept patterns as arguments', function () {
      command.include('.git', '.out');
      assert.lengthOf(command._patterns, 2);
    });

    it('should accept patterns as an Array', function () {
      command.include(['.build', 'docs']);
      assert.lengthOf(command._patterns, 2);
    });

    it('should add patterns to output in order added', function () {
      command.include('LICENSE', 'README.md', 'rsync.js');
      assertOutput(command,
        '--include=LICENSE --include=README.md --include=rsync.js SOURCE DESTINATION');
    });
  });
});
