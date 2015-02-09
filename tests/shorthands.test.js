"use strict";
/* global describe, it */
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

});
