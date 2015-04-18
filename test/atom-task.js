var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper-func');

describe('atom task', function() {

    it('should run sync task', function(done) {
        var mgTask = magicTask();
        var step = false;
        mgTask.define('sync', function(task) {
            step = true;
            task.done('sync data');
        });
        mgTask.run('sync', function(err, errTaskName, data) {
            data['sync'].should.equal('sync data');
            step.should.be.true;
            done();
        });
    });

    it('should run async task', function(done) {
        var mgTask = magicTask();
        var step = false;
        mgTask.define('async', function(task) {
            setTimeout(function() {
                step = true;
                task.done('async data');
            });
        });
        mgTask.run('async', function(err, errTaskName, data) {
            data['async'].should.equal('async data');
            step.should.be.true;
            done();
        });
    });

    it('should run promise task and get data', function(done) {
        var mgTask = magicTask();
        mgTask.define('promise', function() {
            return helper.createPromise('pr');
        });
        mgTask.define('then', ['promise'], function(task, data) {
            data['promise'].should.equal('pr');
            task.done('then data');
        });
        mgTask.run('then', function(err, errTaskName, data) {
            data['then'].should.equal('then data');
            done();
        });
    });

    it('should throw error when arguments not correct', function() {
        var mgTask = magicTask();
        var errorCount = 0;

        try {
            mgTask.define('sync');
        }
        catch (e) {
            errorCount++;
        }

        try {
            mgTask.define('sync', 'test');
        }
        catch (e) {
            errorCount++;
        }

        try {
            mgTask.define('sync', 'test', function() {});
        }
        catch (e) {
            errorCount++;
        }

        errorCount.should.equal(3);
    });

});