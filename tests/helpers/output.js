"use strict";
/* jshint strict: true */
/* global it*/
var assert = require('chai').assert;

var output = module.exports;

/**
 * Create a test setup from a output and an expectation.
 *
 * @param {String} title
 * @param {String|RegExp|Function} expectation
 * @param {Rsync|Function} output
 * @return {Object}
 */
output.createCommandSetup = function createCommandSetup(title, expectation, command) {
  return {
    expect:  expectation,
    title:   title,
    command: command
  };
};

/**
 * Run an Array of command test setups.
 *
 * Each entry in the array must be an Object containing a
 * command and expectkey.
 *
 * @param {Object[]} tests
 */
output.runCommandTests = function runCommandTests(tests) {
  tests.forEach(function (setup) {
    output.runCommandTest(setup.command, setup.expect, setup.title);
  });
};

/**
 * Run one output test.
 *
 * @param {Rsync|Function} command
 * @param {String|RegExp|Function} expectation
 * @param {String} title
 */
output.runCommandTest = function runCommandTest(command, expectation, title) {
  // Exact of partial match
  var exact   = !(expectation instanceof RegExp);
  var matcher = exact ? matchExactExpectation: matchExpectationPattern;

  // Get the results for the command and expectation
  command     = isFunction(command) ? command() : command;
  expectation = isFunction(expectation) ? expectation() : expectation;

  // Run the actual test through mocha
  matcher(command, expectation, title);
};

/**
 * Assert the exact output of a command against an expectation.
 * @param {Rsync|Function} command
 * @param {String|Function} expectation
 * @param {String} message
 */
output.assertOutput = function (command, expectation, message) {
  // Get the results for the command and expectation
  command     = isFunction(command) ? command() : command;
  expectation = isFunction(expectation) ? expectation() : expectation;
  message     = message || 'expected |' + command.command() + '| to equal |' + expectation + '|';

  return assert.strictEqual(command.command(), expectation,
    'expected |' + command.command() + '| to equal |' + expectation + '|');
};
output.assertExactOutput = output.assertOutput;

/**
 * Assert the exact output of a command against an expectation.
 * @param {Rsync|Function} command
 * @param {RegExp|Function} expectation
 * @param {String} message
 */
output.assertOutputPattern = function (command, expectation, message) {
  // Get the results for the command and expectation
  command     = isFunction(command) ? command() : command;
  expectation = isFunction(expectation) ? expectation() : expectation;
  message     = message || 'expected |' + command.command() + '| to match |' + String(expectation) + '|';

  return assert(expectation.test(command.command()),
    'expected |' + command.command() + '| to match |' + String(expectation) + '|');
};

/** Private functions **/


function isFunction(input) {
  return typeof input === 'function';
}

function matchExactExpectation(command, expectation, title) {
  title = title || 'should build to "' + expectation + '"';

  it (title, function() {
    assert.strictEqual(command.command(), expectation,
      'EXPECTED |' + command.command() + '| TO EQUAL |' + expectation + '|');
  });
}

function matchExpectationPattern(command, expectation, title) {
  title = title || 'should match "' + String(expectation) + '"';

  it (title, function () {
    assert(expectation.test(command.command()),
      'EXPECTED |' + command.command() + '| TO MATCH |' + String(expectation) + '|');
  });
}

