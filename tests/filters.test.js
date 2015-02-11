/*global describe,it,beforeEach,xdescribe,xit*/
'use strict';
var assert = require('chai').assert;
var assertOutput = require('./helpers/output').assertOutput;

var Rsync  = require('../rsync');

describe('filters', function () {
    var command;

    beforeEach(function () {
        command = Rsync.build({
            'source':      'SOURCE',
            'destination': 'DESTINATION'
        });
    });

    describe('#patterns', function () {

        it('should interpret the first character', function () {
            command.patterns(['-.git', '+/tests/*.test.js']);
            assert.lengthOf(command._patterns, 2);
        });

        it('should be able to be set as an Object', function () {
            command.patterns([
                { 'action': '+', 'pattern': '.git' },
                { 'action': '-', 'pattern': '/tests/*.test' }
            ]);
            assert.lengthOf(command._patterns, 2);
        });

        it('should throw an error for invalid patterns', function () {
            assert.throw(function () {
                command.patterns(['*invalid']);
            }, /^invalid pattern:/i);
        });

        it('should add patterns to output in order added', function () {
            command.patterns([
                { 'action': '-', 'pattern': '.git' },
                { 'action': '+', 'pattern': '/tests/*.test.js' },
                '-build/*'
            ]);
            assertOutput(command, 'rsync --exclude=.git --include=/tests/*.test.js --exclude=build/* SOURCE DESTINATION');
        });

    });

    describe('#exclude', function () {

        it('should accept patterns as arguments', function () {
            command.exclude('.git', '.out');
            assert.lengthOf(command._patterns, 2);
        });

        it ('should accept patterns as an Array', function () {
            command.exclude(['.build', 'docs']);
            assert.lengthOf(command._patterns, 2);
        });

        it('should add patterns to output in order added', function () {
            command.exclude('.git', 'docs', '/tests/*.test.js');
            assertOutput(command, 'rsync --exclude=.git --exclude=docs --exclude=/tests/*.test.js SOURCE DESTINATION');
        });

        it('should escape filenames', function () {
            command.exclude('with space', 'tests/* test.js');
            assertOutput(command, 'rsync --exclude=with\\ space --exclude=tests/*\\ test.js SOURCE DESTINATION');
        });

    });

    describe('#include', function () {

        it('should accept patterns as arguments', function () {
            command.include('.git', '.out');
            assert.lengthOf(command._patterns, 2);
        });

        it ('should accept patterns as an Array', function () {
            command.include(['.build', 'docs']);
            assert.lengthOf(command._patterns, 2);
        });

        it('should add patterns to output in order added', function () {
            command.include('LICENSE', 'README.md', 'rsync.js');
            assertOutput(command, 'rsync --include=LICENSE --include=README.md --include=rsync.js SOURCE DESTINATION');
        });

        it('should escape filenames', function () {
            command.include('LICENSE FILE', '/tests/* test.js');
            assertOutput(command, 'rsync --include=LICENSE\\ FILE --include=/tests/*\\ test.js SOURCE DESTINATION');
        });

    });

});
