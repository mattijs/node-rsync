'use strict';

const assert = require('chai').assert;
const output = module.exports;

/**
 * Assert the exact output of a command against an expectation.
 *
 * @param {Rsync|Function} command
 * @param {String|Function|RegExp} expectation
 * @param {String} [message]
 */
output.assertOutput = (command, expectation, message) => {
  command = isFunction(command) ? command() : command;
  expectation = isFunction(expectation) ? expectation() : `${command.executable()} ${expectation}`;
  message =
    message || `expected |${command.command()}| to equal |${expectation}|`;

  return assert.strictEqual(command.command(), expectation, message);
};
output.assertExactOutput = output.assertOutput;

/**
 * Assert the exact output of a command against an expectation.
 *
 * @param {Rsync|Function} command
 * @param {RegExp|Function} expectation
 * @param {String} [message]
 */
output.assertOutputPattern = (command, expectation, message) => {
  command = isFunction(command) ? command() : command;
  expectation = isFunction(expectation) ? expectation() : expectation;
  message =
    message ||
    `expected |${command.command()}| to match |${String(expectation)}|`;

  return assert(expectation.test(command.command()), message);
};

function isFunction (input) {
  return typeof input === 'function';
}
