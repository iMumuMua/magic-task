var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper');

var asyncTask = function(task, data) {
    var asyncFunc = helper.createAsyncFunc();
    asyncFunc(data, task.async);
};

var asyncFailTask = function(task, data) {
    var asyncFunc = helper.createAsyncFunc(false, true);
    asyncFunc(data, task.async);
};

var promiseTask = function(task, data) {
    task.promise = helper.createPromise(data);
};

var promiseFailTask = function(task, data) {
    task.promise = helper.createPromise(data, true);
};


describe.skip('magic runner', function() {

    describe('run', function() {
        
    });

    describe('waterfall', function() {
        
    });

    describe('parellel', function() {
        
    });

    describe('each', function() {
        
    });

    describe('map', function() {
        
    });

    describe('whilst', function() {
        
    });

    describe('doWhilst', function() {
        
    });

});