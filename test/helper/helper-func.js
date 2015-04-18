/**
 * helper functions for test
 */

var Q = require('q');

exports.createPromise = function(data, isThrowError) {
    return Q.fcall(function() {
        if (isThrowError) {
            throw new Error('promise err');
        }
        else {
            return data;
        }
    });
};

exports.asyncFunc = function(time, isThrowError, callback) {
    setTimeout(function() {
        if (isThrowError) {
            callback(new Error('async err'));
        }
        else {
            callback(null, time);
        }
    }, time);
};

exports.asyncMultiResFunc = function(time, isThrowError, callback) {
    setTimeout(function() {
        if (isThrowError) {
            callback(new Error('async err'));
        }
        else {
            callback(null, time, time * 2, time * 3);
        }
    }, time);
};