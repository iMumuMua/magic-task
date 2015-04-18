var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper-func');

describe('error handle', function() {

    it('should catch sync task error', function(done) {
        var mgTask = magicTask();
        mgTask.define('sync', function(task) {
            task.fail(new Error('sync err'));
        });
        mgTask.run('sync', function(err, errTaskName) {
            err.message.should.equal('sync err');
            errTaskName.should.equal('sync');
            done();
        });
    });

    it('should catch async task error', function(done) {
        var mgTask = magicTask();
        mgTask.define('async', function(task) {
            setTimeout(function() {
                task.fail(new Error('async err'));
            });
        });
        mgTask.run('async', function(err, errTaskName) {
            err.message.should.equal('async err');
            errTaskName.should.equal('async');
            done();
        });
    });

    it('should catch promise task error', function(done) {
        var mgTask = magicTask();
        mgTask.define('promise', function() {
            return helper.createPromise('pr', true);
        });
        mgTask.define('then', ['promise'], function(task, data) {
            should(true).be.false;
            task.done();
        });
        mgTask.run('then', function(err, errTaskName) {
            err.message.should.equal('promise err');
            errTaskName.should.equal('promise');
            done();
        });
    });

    it('should catch sub task error', function(done) {
        var mgTask = magicTask();
        mgTask.define('sub', function(task) {
            setTimeout(function() {
                task.done();
            });
        });
        mgTask.define('error task', function(task) {
            setTimeout(function() {
                task.fail(new Error('task fail'));
            }, 10);
        });
        mgTask.define('end', ['sub', 'error task'], function(task) {
            should(true).be.false;
            task.done();
        });
        mgTask.run('end', function(err, errTaskName) {
            err.message.should.equal('task fail');
            errTaskName.should.equal('error task');
            done();
        });
    });

});