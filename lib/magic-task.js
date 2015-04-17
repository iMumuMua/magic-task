/**
 * magic-task
 * https://github.com/iMumuMua/magic-task
 */

(function() {

    'use strict';

    var magicTask = {}; // TODO


    if (typeof module !== 'undefined' && module.exports) {
        module.exports = magicTask;
    }
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function() {
            return magicTask;
        });
    }
    else {
        this.magicTask = magicTask;
    }

}());