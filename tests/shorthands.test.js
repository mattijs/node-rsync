"use strict";
/* global describe, it */
var assert = require('chai').assert;
var Rsync = require('../rsync');
var assertOutput = require('./helpers/output').assertOutput;
var assertOutputPattern = require('./helpers/output').assertOutputPattern;

describe('shorthands', function () {
    var command, output;

    beforeEach(function() {
        command = Rsync.build({
            'source': 'SOURCE',
            'destination': 'DESTINATION'
        });
        output = 'rsync SOURCE DESTINATION';
    });

//# shell /////////////////////////////////////////////////////////////////////////////////////////
    describe('#shell', function () {
        var rsync;
        it('should add rsh option', function () {
            rsync = Rsync.build({
                'source':       'source',
                'destination':  'destination',
                'shell':        'ssh'
            });
            assertOutput(rsync, 'rsync --rsh=ssh source destination');
      });

      it('should escape options with spaces', function () {
            rsync = Rsync.build({
                'source':       'source',
                'destination':  'destination',
                'shell':        'ssh -i /home/user/.ssh/rsync.key'
            });
            assertOutput(rsync, 'rsync --rsh="ssh -i /home/user/.ssh/rsync.key" source destination');
      });
  });

//# chmod /////////////////////////////////////////////////////////////////////////////////////////
    describe('#chmod', function () {
        var rsync;

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
                'chmod': [ 'og=uwx', 'rx=ogw' ]
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
            var inputValues = [ 'og=uwx', 'rx=ogw' ];
            rsync = Rsync.build({
                'source': 'source',
                'destination': 'destination',
                'chmod': inputValues
            });

            var values = rsync.chmod();
            assert.deepEqual(values, inputValues);
        });
    });

//# delete ////////////////////////////////////////////////////////////////////////////////////////
    describe('#delete', function () {
        var testSet = function () {
            command.delete();
            assertOutputPattern(command, /^rsync --delete/);
            return command;
        };
        it('should add the delete option', testSet);
        it('should be able to be unset', function () {
            testSet().delete(false);
            assertOutput(command, output);
        });
    });

//# progress //////////////////////////////////////////////////////////////////////////////////////
    describe('#progress', function () {
        var testSet = function () {
            command.progress();
            assertOutputPattern(command, /^rsync --progress/);
            return command;
        };
        it('should add the progress option', testSet);
        it('should be able to be unset', function () {
            testSet().progress(false);
            assertOutput(command, output);
        });
    });

//# archive ///////////////////////////////////////////////////////////////////////////////////////
    describe('#archive', function () {
        var testSet = function () {
            command.archive();
            assertOutputPattern(command, /^rsync -a/);
            return command;
        };
        it('should add the archive flag', testSet);
        it('should be able to be unset', function () {
            testSet().archive(false);
            assertOutput(command, output);
        });
    });

//# compress //////////////////////////////////////////////////////////////////////////////////////
    describe('#compress', function () {
        var testSet = function () {
            command.compress();
            assertOutputPattern(command, /^rsync -z/);
            return command;
        };
        it('should add the compress flag', testSet);
        it('should be able to be unset', function () {
            command = testSet().compress(false);
            assertOutput(command, output);
        });
    });

//# recursive /////////////////////////////////////////////////////////////////////////////////////
    describe('#recursive', function () {
        var testSet = function () {
            command.recursive();
            assertOutputPattern(command, /^rsync -r/);
            return command;
        };
        it('should add the recursive flag', testSet);
        it('should be able to be unset', function () {
            command = testSet().recursive(false);
            assertOutput(command, output);
        });
    });

//# update ////////////////////////////////////////////////////////////////////////////////////////
    describe('#update', function () {
        var testSet = function () {
            command.update();
            assertOutputPattern(command, /^rsync -u/);
            return command;
        };
        it('should add the update flag', testSet);
        it('should be able to be unset', function () {
            command = testSet().update(false);
            assertOutput(command, output);
        });
    });

//# quiet /////////////////////////////////////////////////////////////////////////////////////////
    describe('#quiet', function () {
        var testSet = function () {
            command.quiet();
            assertOutputPattern(command, /^rsync -q/);
            return command;
        };
        it('should add the quiet flag', testSet);
        it('should be able to be unset', function () {
            command = testSet().quiet(false);
            assertOutput(command, output);
        });
    });

//# dirs //////////////////////////////////////////////////////////////////////////////////////////
    describe('#dirs', function () {
        var testSet = function () {
            command.dirs();
            assertOutputPattern(command, /^rsync -d/);
            return command;
        };
        it('should add the dirs flag', testSet);
        it('should be able to be unset', function () {
            command = testSet().dirs(false);
            assertOutput(command, output);
        });
    });

//# links /////////////////////////////////////////////////////////////////////////////////////////
    describe('#links', function () {
        var testSet = function () {
            command.links();
            assertOutputPattern(command, /^rsync -l/);
            return command;
        };
        it('should add the links flag', testSet);
        it('should be able to be unset', function () {
            command = testSet().links(false);
            assertOutput(command, output);
        });
    });

//# dry ///////////////////////////////////////////////////////////////////////////////////////////
    describe('#dry', function () {
        var testSet = function () {
            command.dry();
            assertOutputPattern(command, /rsync -n/);
            return command;
        };
        it('should add the dry flag', testSet);
        it('should be able to be unset', function () {
            command = testSet().dry(false);
            assertOutput(command, output);
        });
    });

//# hardLinks/////////////////////////////////////////////////////////////////////////////////////
    describe('#hardLinks', function () {

        it('should add the hard links flag', function () {
            command.hardLinks();
            assertOutputPattern(command, /rsync -H/);
        });

        it('should unset the hard links flag', function () {
            command.hardLinks();
            assertOutputPattern(command, /rsync -H/);
            command.hardLinks(false);
            assertOutput(command, output);
        });

    });

//# perms ////////////////////////////////////////////////////////////////////////////////////////
    describe('#perms', function () {

      it('should add the perms flag', function () {
        command.perms();
        assertOutputPattern(command, /rsync -p/);
      });

      it('should unset the perms flag', function () {
        command.perms();
        assertOutputPattern(command, /rsync -p/);
        command.perms(false);
        assertOutput(command, output);
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
        assertOutput(command, output);
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
        assertOutput(command, output);
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
        assertOutput(command, output);
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
        assertOutput(command, output);
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
        assertOutput(command, output);
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
        assertOutput(command, output);
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
        assertOutput(command, output);
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
        assertOutput(command, output);
      });

    });

});
