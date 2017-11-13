/* eslint-env mocha */
'use strict';
const assert = require('chai').assert;
const {Rsync} = require('../index');

describe('options', function () {
  let command;
  beforeEach(() => {
    command = new Rsync();
  });

  // # set
  // ///////////////////////////////////////////////////////////////////////////////////////////
  describe('#set', function () {
    it('should set a an option with a value', function () {
      command.set('rsh', 'ssh');
      assert.propertyVal(command._options, 'rsh', 'ssh');
    });

    it('should enable an option without a value', function () {
      command.set('dir');
      assert.property(command._options, 'dir');
    });

    it('should strip leading dashes', function () {
      command.set('--progress');
      command.set('--rsh', 'ssh');
      assert.property(command._options, 'progress');
      assert.propertyVal(command._options, 'rsh', 'ssh');
    });
  });

  // # unset
  // /////////////////////////////////////////////////////////////////////////////////////////
  describe('#unset', function () {
    it('should unset an option that has a value', function () {
      command.set('rsh', 'ssh');
      assert.propertyVal(command._options, 'rsh', 'ssh');

      command.unset('rsh');
      assert.lengthOf(Object.keys(command._options), 0);
      assert.notProperty(command._options, 'rsh');
    });

    it('should unset an enabled options', function () {
      command.set('progress');
      assert.property(command._options, 'progress');

      command.unset('progress');
      assert.notProperty(command._options, 'progress');
    });

    it('should unset an option that was not set', function () {
      assert.notProperty(command._options, 'dirs');
      command.unset('dirs');
      assert.notProperty(command._options, 'dirs');
    });
  });

  // # isSet
  // /////////////////////////////////////////////////////////////////////////////////////////
  describe('#isSet', function () {
    it('should return if an option is set', function () {
      command.set('inplace');
      assert.isTrue(command.isSet('inplace'));

      command.set('b');
      assert.isTrue(command.isSet('b'));

      command.set('max-size', '1009');
      assert.isTrue(command.isSet('max-size'));
    });

    it('should strip leading dashes from option name', function () {
      command.set('inplace');
      assert.isTrue(command.isSet('--inplace'));

      command.set('b');
      assert.isTrue(command.isSet('-b'));

      command.set('max-size', '1009');
      assert.isTrue(command.isSet('--max-size'));
    });
  });

  // # option
  // ////////////////////////////////////////////////////////////////////////////////////////
  describe('#option', function () {
    it('should return the value for an option', function () {
      command.set('max-size', '1009');
      assert.equal(command.option('max-size'), '1009');
    });

    it('should return `undefined` for a valueless option', function () {
      command.set('progress');
      assert.isUndefined(command.option('progress'));
    });

    it('should return undefined for an option that is not set', function () {
      assert.isUndefined(command.option('random'));
    });

    it('should strip leading dashes from option names', function () {
      command.set('progress');
      assert.isUndefined(command.option('--progress'));

      command.set('g');
      assert.isUndefined(command.option('-g'));

      command.set('max-size', '2009');
      assert.equal(command.option('--max-size'), '2009');

      assert.isUndefined(command.option('--random'));
    });
  });

  // # flags
  // /////////////////////////////////////////////////////////////////////////////////////////
  describe('#setFlags', function () {
    it('it should set multiple flags from a String', function () {
      command.setFlags('avz');
      assert.sameMembers(Object.keys(command._options), ['a', 'v', 'z']);
    });

    it('should set multiple flags from arguments', function () {
      command.setFlags('v', 'z', 'a');
      assert.sameMembers(Object.keys(command._options), ['a', 'v', 'z']);
    });

    it('should set multiple flags from an array', function () {
      command.setFlags(['z', 'a', 'v']);
      assert.sameMembers(Object.keys(command._options), ['a', 'v', 'z']);
    });
  });

  describe('#unsetFlags', function () {
    it('should unset multiple flags from a string', function () {
      command.setFlags('avz');
      assert.sameMembers(Object.keys(command._options), ['a', 'v', 'z']);

      command.unsetFlags('az');
      assert.sameMembers(Object.keys(command._options), ['v']);
    });

    it('should unset multiple flags from arguments', function () {
      command.setFlags('avz');
      assert.sameMembers(Object.keys(command._options), ['a', 'v', 'z']);

      command.unsetFlags('z', 'v');
      assert.sameMembers(Object.keys(command._options), ['a']);
    });

    it('should unset multiple flags from an array', function () {
      command.setFlags('avz');
      assert.sameMembers(Object.keys(command._options), ['a', 'v', 'z']);

      command.unsetFlags(['a', 'v']);
      assert.sameMembers(Object.keys(command._options), ['z']);
    });
  });
});
