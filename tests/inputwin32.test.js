/* global describe,it */
"use strict";

var assertOutputPattern = require('./helpers/output').assertOutputPattern;
var Rsync = require('../rsync');

describe('inputwin32', function () {
    before(function(){
        this.originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {  
            value: 'win32'
        });
    });

    //# sources under windows
    describe('#sourcewin32', function () {
        var rsync;
        
        it('should convert windows path under windows',function () {
            rsync = Rsync.build({
                source:       [ 'C:\\home\\username\\develop\\readme.txt' ],
                destination:  'themoon'
            });
            assertOutputPattern(rsync, / \/home\/username\/develop\/readme\.txt /);
        });
    });
    
    //# destination under win32
    describe('#destinationwin32', function () {
        var rsync;
        
        it('should convert widows path for destination', function () {
            rsync = Rsync.build({
              source:       [ 'reame.txt' ],
              destination:  'C:\\home\\username\\develop\\'
            });
            assertOutputPattern(rsync, /\/home\/username\/develop\//);
        });
        
    });

    after(function(){
        Object.defineProperty(process, 'platform', {  
            value: this.originalPlatform
        });
    });
});
