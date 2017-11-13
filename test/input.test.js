/* eslint-env mocha */
'use strict';

const assertOutputPattern = require('./helpers/output').assertOutputPattern;
const {Rsync} = require('../index');

describe('input', function () {
  // # sources
  describe('#source', function () {
    let rsync;

    it('should be able to be set as a single String', function () {
      rsync = Rsync.build({
        source: 'afile.txt',
        destination: 'some_location.txt'
      });
      assertOutputPattern(rsync, /\safile.txt\s/g);
    });

    it('should be able to be set as an Array', function () {
      rsync = Rsync.build({
        source: ['afile.txt', 'bfile.txt'],
        destination: 'some_location.txt'
      });
      assertOutputPattern(rsync, /\safile.txt bfile.txt\s/g);
    });

    it('should not escape regular filenames', function () {
      rsync = Rsync.build({
        source: ['some_file.txt'],
        destination: 'wherever_we_want.txt'
      });
      assertOutputPattern(rsync, /\ssome_file.txt\s/g);
    });
  });

  // # destination
  describe('#destination', function () {
    let rsync;

    it('should not have regular filenames escaped', function () {
      rsync = Rsync.build({
        source: ['file1.txt'],
        destination: 'the_destination/'
      });
      assertOutputPattern(rsync, /the_destination\/$/);
    });

    it('should have dollar sign characters escaped', function () {
      rsync = Rsync.build({
        source: ['file3.txt'],
        destination: '$some_destination/'
      });
      assertOutputPattern(rsync, /\$some_destination\/$/);
    });
  });
});
