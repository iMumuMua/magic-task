/**
 * helper functions for test
 */

var Q = require('q');

exports.createPromise = function(data, isThrowError) {
    return Q.fcall(function() {
        if (isThrowError) {
            throw new Error('promise error');
        }
        else {
            return data;
        }
    });
};