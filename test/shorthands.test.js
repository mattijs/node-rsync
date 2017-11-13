/* eslint-env mocha */
'use strict';
const assert = require('chai').assert;
const {Rsync} = require('../index');
const {assertOutputPattern} = require('./helpers/output');

describe('shorthands', function () {
  let command, output;

  beforeEach(() => {
    command = Rsync.build({
      'source': 'SOURCE',
      'destination': 'DESTINATION'
    });
    output = /rsync SOURCE DESTINATION/;
  });

  // # shell
  // /////////////////////////////////////////////////////////////////////////////////////////
  describe('#shell', function () {
    let rsync;
    it('should add rsh option', function () {
      rsync = Rsync.build({
        'source': 'source',
        'destination': 'destination',
        'shell': 'ssh'
      });
      assertOutputPattern(rsync, /rsync --rsh=ssh source destination/);
    });

    it('should escape options with spaces', function () {
      rsync = Rsync.build({
        'source': 'source',
        'destination': 'destination',
        'shell': 'ssh -i /home/user/.ssh/rsync.key'
      });
      assertOutputPattern(rsync,
        /rsync --rsh="ssh -i \/home\/user\/\.ssh\/rsync\.key" source destination/);
    });
  });

  // # chmod
  // /////////////////////////////////////////////////////////////////////////////////////////
  describe('#chmod', function () {
    let rsync;

    it('should allow a simple value through build', function () {
      rsync = Rsync.build({
        'source': 'source',
        'destination': 'destination',
        'chmod': 'ug=rwx'
      });
      assertOutputPattern(rsync, /chmod=ug=rwx/i);
    });

    it('should allow multiple values through build', function () {
      rsync = Rsync.build({
        'source': 'source',
        'destination': 'destination',
        'chmod': ['og=uwx', 'rx=ogw']
      });
      assertOutputPattern(rsync, /chmod=og=uwx --chmod=rx=ogw/);
    });

    it('should allow multiple values through setter', function () {
      rsync = Rsync.build({
        'source': 'source',
        'destination': 'destination'
      });
      rsync.chmod('o=rx');
      rsync.chmod('ug=rwx');
      assertOutputPattern(rsync, /--chmod=o=rx --chmod=ug=rwx/);
    });

    it('should return all the chmod values', function () {
      const inputValues = ['og=uwx', 'rx=ogw'];
      rsync = Rsync.build({
        'source': 'source',
        'destination': 'destination',
        'chmod': inputValues
      });

      const values = rsync.chmod();
      assert.deepEqual(values, inputValues);
    });
  });

  // # delete
  // ////////////////////////////////////////////////////////////////////////////////////////
  describe('#delete', function () {
    const testSet = () => {
      command.delete();
      assertOutputPattern(command, /rsync --delete/);
      return command;
    };
    it('should add the delete option', testSet);
    it('should be able to be unset', function () {
      testSet().delete(false);
      assertOutputPattern(command, output);
    });
  });

  // # progress
  // //////////////////////////////////////////////////////////////////////////////////////
  describe('#progress', function () {
    const testSet = () => {
      command.progress();
      assertOutputPattern(command, /rsync --progress/);
      return command;
    };
    it('should add the progress option', testSet);
    it('should be able to be unset', function () {
      testSet().progress(false);
      assertOutputPattern(command, output);
    });
  });

  // # archive
  // ///////////////////////////////////////////////////////////////////////////////////////
  describe('#archive', function () {
    const testSet = () => {
      command.archive();
      assertOutputPattern(command, /rsync -a/);
      return command;
    };
    it('should add the archive flag', testSet);
    it('should be able to be unset', function () {
      testSet().archive(false);
      assertOutputPattern(command, output);
    });
  });

  // # compress
  // //////////////////////////////////////////////////////////////////////////////////////
  describe('#compress', function () {
    const testSet = () => {
      command.compress();
      assertOutputPattern(command, /rsync -z/);
      return command;
    };
    it('should add the compress flag', testSet);
    it('should be able to be unset', function () {
      command = testSet().compress(false);
      assertOutputPattern(command, output);
    });
  });

  // # recursive
  // /////////////////////////////////////////////////////////////////////////////////////
  describe('#recursive', function () {
    const testSet = () => {
      command.recursive();
      assertOutputPattern(command, /rsync -r/);
      return command;
    };
    it('should add the recursive flag', testSet);
    it('should be able to be unset', function () {
      command = testSet().recursive(false);
      assertOutputPattern(command, output);
    });
  });

  // # update
  // ////////////////////////////////////////////////////////////////////////////////////////
  describe('#update', function () {
    const testSet = () => {
      command.update();
      assertOutputPattern(command, /rsync -u/);
      return command;
    };
    it('should add the update flag', testSet);
    it('should be able to be unset', function () {
      command = testSet().update(false);
      assertOutputPattern(command, output);
    });
  });

  // # quiet
  // /////////////////////////////////////////////////////////////////////////////////////////
  describe('#quiet', function () {
    const testSet = () => {
      command.quiet();
      assertOutputPattern(command, /rsync -q/);
      return command;
    };
    it('should add the quiet flag', testSet);
    it('should be able to be unset', function () {
      command = testSet().quiet(false);
      assertOutputPattern(command, output);
    });
  });

  // # dirs
  // //////////////////////////////////////////////////////////////////////////////////////////
  describe('#dirs', function () {
    const testSet = () => {
      command.dirs();
      assertOutputPattern(command, /rsync -d/);
      return command;
    };
    it('should add the dirs flag', testSet);
    it('should be able to be unset', function () {
      command = testSet().dirs(false);
      assertOutputPattern(command, output);
    });
  });

  // # links
  // /////////////////////////////////////////////////////////////////////////////////////////
  describe('#links', function () {
    const testSet = () => {
      command.links();
      assertOutputPattern(command, /rsync -l/);
      return command;
    };
    it('should add the links flag', testSet);
    it('should be able to be unset', function () {
      command = testSet().links(false);
      assertOutputPattern(command, output);
    });
  });

  // # dry
  // ///////////////////////////////////////////////////////////////////////////////////////////
  describe('#dry', function () {
    const testSet = () => {
      command.dry();
      assertOutputPattern(command, /rsync -n/);
      return command;
    };
    it('should add the dry flag', testSet);
    it('should be able to be unset', function () {
      command = testSet().dry(false);
      assertOutputPattern(command, output);
    });
  });

  // #
  // hardLinks/////////////////////////////////////////////////////////////////////////////////////
  describe('#hardLinks', function () {
    it('should add the hard links flag', function () {
      command.hardLinks();
      assertOutputPattern(command, /rsync -H/);
    });

    it('should unset the hard links flag', function () {
      command.hardLinks();
      assertOutputPattern(command, /rsync -H/);
      command.hardLinks(false);
      assertOutputPattern(command, output);
    });
  });

  // # perms
  // ////////////////////////////////////////////////////////////////////////////////////////
  describe('#perms', function () {
    it('should add the perms flag', function () {
      command.perms();
      assertOutputPattern(command, /rsync -p/);
    });

    it('should unset the perms flag', function () {
      command.perms();
      assertOutputPattern(command, /rsync -p/);
      command.perms(false);
      assertOutputPattern(command, output);
    });
  });

  describe('#executability', function () {
    it('should add the executability flag', function () {
      command.executability();
      assertOutputPattern(command, /rsync -E/);
    });

    it('should unset the executability flag', function () {
      command.executability();
      assertOutputPattern(command, /rsync -E/);
      command.executability(false);
      assertOutputPattern(command, output);
    });
  });

  describe('#owner', function () {
    it('should add the owner flag', function () {
      command.owner();
      assertOutputPattern(command, /rsync -o/);
    });

    it('should unset the owner flag', function () {
      command.owner();
      assertOutputPattern(command, /rsync -o/);
      command.owner(false);
      assertOutputPattern(command, output);
    });
  });

  describe('#group', function () {
    it('should add the group flag', function () {
      command.group();
      assertOutputPattern(command, /rsync -g/);
    });

    it('should unset the group flag', function () {
      command.group();
      assertOutputPattern(command, /rsync -g/);
      command.group(false);
      assertOutputPattern(command, output);
    });
  });

  describe('#acls', function () {
    it('should set the acls flag', function () {
      command.acls();
      assertOutputPattern(command, /rsync -A/);
    });

    it('should unset the acls flag', function () {
      command.acls();
      assertOutputPattern(command, /rsync -A/);
      command.acls(false);
      assertOutputPattern(command, output);
    });
  });

  describe('#xattrs', function () {
    it('should set the xattrs flag', function () {
      command.xattrs();
      assertOutputPattern(command, /rsync -X/);
    });

    it('should unset the xattrs flag', function () {
      command.xattrs();
      assertOutputPattern(command, /rsync -X/);
      command.xattrs(false);
      assertOutputPattern(command, output);
    });
  });

  describe('#devices', function () {
    it('should set the the devices option', function () {
      command.devices();
      assertOutputPattern(command, /rsync --devices/);
    });

    it('should unset the devices option', function () {
      command.devices();
      assertOutputPattern(command, /rsync --devices/);
      command.devices(false);
      assertOutputPattern(command, output);
    });
  });

  describe('#specials', function () {
    it('should set the the specials option', function () {
      command.specials();
      assertOutputPattern(command, /rsync --specials/);
    });

    it('should unset the specials option', function () {
      command.specials();
      assertOutputPattern(command, /rsync --specials/);
      command.specials(false);
      assertOutputPattern(command, output);
    });
  });

  describe('#times', function () {
    it('should set the the times option', function () {
      command.times();
      assertOutputPattern(command, /rsync -t/);
    });

    it('should unset the times option', function () {
      command.times();
      assertOutputPattern(command, /rsync -t/);
      command.times(false);
      assertOutputPattern(command, output);
    });
  });
});
