/*global describe,it*/
"use strict";
var Rsync  = require('../rsync');
var assertOutput = require('./helpers/output').assertOutput;

/**
 * Some general and weird test cases for command output.
 *
 * These tests are meant as a general safeguard to complement
 * unit tests.
 */
var testCases = [
  { expect: 'rsync -avz --exclude=no-go.txt --exclude=with\\ space --exclude=.git --exclude=*.tiff path_a/ path_b',
    build: function() {
      return new Rsync()
        .flags('avz')
        .source('path_a/')
        .exclude('no-go.txt')
        .exclude('with space')
        .exclude('.git')
        .exclude('*.tiff')
        .destination('path_b');
  }},
  { expect: 'rsync -rav -f "- .git" test-dir/ test-dir-copy',
    build: function() {
      return new Rsync()
        .flags('rav')
        .set('f', '- .git')
        .source('test-dir/')
        .destination('test-dir-copy');
  }}
];

describe('output tests', function () {

    testCases.forEach(function buildTestCase(testCase, index) {
        var message = 'passes case ' +  (index + 1);
        it(message, function() {
            assertOutput(testCase.build(), testCase.expect);
        });
    });

});
