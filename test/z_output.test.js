/* eslint-env mocha */
'use strict';
const { Rsync } = require('../index');
const { assertOutput } = require('./helpers/output');

/**
 * Some general and weird test cases for command output.
 *
 * These tests are meant as a general safeguard to complement
 * unit tests.
 */
const testCases = [{
  expect: '-avz --exclude=no-go.txt --exclude="with space" --exclude=.git --exclude=*.tiff path_a/ path_b',
  build () {
    return new Rsync()
      .setFlags('avz')
      .source('path_a/')
      .exclude('no-go.txt')
      .exclude('with space')
      .exclude('.git')
      .exclude('*.tiff')
      .destination('path_b');
  }
}, {
  expect: '-rav -f "- .git" test-dir/ test-dir-copy',
  build () {
    return new Rsync()
      .setFlags('rav')
      .set('f', '- .git')
      .source('test-dir/')
      .destination('test-dir-copy');
  }
}];

describe('output tests', function () {
  testCases.forEach((testCase, index) => {
    const message = `passes case ${index + 1}`;
    it(message, () => {
      assertOutput(testCase.build(), testCase.expect);
    });
  });
});
