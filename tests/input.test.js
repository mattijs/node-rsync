/* global describe,it */
"use strict";

var assertOutputPattern = require('./helpers/output').assertOutputPattern;
var Rsync = require('../rsync');

describe('input', function () {

    //# sources
    describe('#source', function () {
      var rsync;

      it('should be able to be set as a single String', function () {
          rsync = Rsync.build({
              source:       'afile.txt',
              destination:  'some_location.txt'
          });
          assertOutputPattern(rsync, /\safile.txt\s/g);
      });

      it('should be able to be set as an Array', function () {
          rsync = Rsync.build({
              source:       [ 'afile.txt', 'bfile.txt' ],
              destination:  'some_location.txt'
          });
          assertOutputPattern(rsync, /\safile.txt bfile.txt\s/g);
      });

      it('should not escape regular filenames', function () {
          rsync = Rsync.build({
              source:       [ 'some_file.txt' ],
              destination:  'wherever_we_want.txt'
          });
          assertOutputPattern(rsync, /\ssome_file.txt\s/g);
      });

      it('should escape spaced filenames', function () {
          rsync = Rsync.build({
              source:       [ 'some file.txt' ],
              destination:  'wherever_we_want.txt'
          });
          assertOutputPattern(rsync, /\ssome\\ file.txt\s/g);
      });

      it('should have quote characters escaped',function () {
          rsync = Rsync.build({
              source:       [ 'a_quoted\'filename\".txt' ],
              destination:  'themoon'
          });
          assertOutputPattern(rsync, / a_quoted\\'filename\\".txt /);
      });

      it('should have parentheses escaped', function () {
          rsync = Rsync.build({
              source:       [ 'a (file) with parantheses.txt' ],
              destination:  'themoon'
          });
          assertOutputPattern(rsync, /a\\ \\\(file\\\)\\ with\\ parantheses.txt/);
      });

      it('should allow mixed filenames', function () {
          rsync = Rsync.build({
              source: [
                 'example file.txt', 'manual.pdf', '\'special_case 1\'.rtf'
              ],
              destination: 'somewhere_else/'
          });
          assertOutputPattern(rsync, / example\\ file.txt manual.pdf \\'special_case\\ 1\\'.rtf/);
      });

    });

    //# destination
    describe('#destination', function () {
        var rsync;

        it('should not have regular filenames escaped', function () {
            rsync = Rsync.build({
                source:      [ 'file1.txt' ],
                destination: 'the_destination/'
            });
          assertOutputPattern(rsync, /the_destination\/$/);
        });

        it('should have spaced filenames escaped', function () {
            rsync = Rsync.build({
                source:       [ 'file2.txt' ],
                destination:  'whereever we want.txt'
            });
            assertOutputPattern(rsync, /whereever\\ we\\ want.txt$/);
        });

        it('should have quote characters escaped', function () {
            rsync = Rsync.build({
              source:       [ 'space.txt' ],
              destination:  '\'to infinity and beyond\"/'
            });
            assertOutputPattern(rsync, /\\'to\\ infinity\\ and\\ beyond\\"\/$/);
        });
        it('should have dollar sign characters escaped', function () {
            rsync = Rsync.build({
              source:       [ 'file3.txt' ],
              destination:  '$some_destination/'
            });
            assertOutputPattern(rsync, /\$some_destination\/$/);
        });


    });

});
