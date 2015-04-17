var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper-func');

describe('atom task', function() {

    it('should run sync task', function(done) {
        var mgTask = magicTask();
        var step = false;
        mgTask.define('sync', function() {
            step = true;
        });
        mgTask.run(function(err) {
            step.should.be.true;
            done(err);
        });
    });

    it('should run async task', function(done) {
        var mgTask = magicTask();
        var step = false;
        mgTask.define('async', function(task) {
            setTimeout(function() {
                step = true;
                task.done();
            });
        });
        mgTask.run(function(err) {
            step.should.be.true;
            done(err);
        });
    });

    it('should run promise task', function(done) {
        var mgTask = magicTask();
        var data = 'pr';
        mgTask.define('promise', function(task) {
            return helper.createPromise(data);
        });
        mgTask.define('then', ['promise'] function(task, data) {
            data['promise'].should.equal('pr');
        });
        mgTask.run(done);
    });

    it('should run sub task', function(done) {
        var mgTask = magicTask();
        var steps = [false, false];
        mgTask.define('step0', function() {
            steps[0] = true;
        });
        mgTask.define('step1', ['step0'], function() {
            steps[1] = true;
        });
        mgTask.run(function(err) {
            steps[0].should.be.true;
            steps[1].should.be.true;
            done(err);
        });
    });

    it('should run multi sub task', function(done) {
        var mgTask = magicTask();
        var steps = {};
        mgTask.define('subA', function() {
            steps['subA'] = true;
        });
        mgTask.define('subB', function() {
            steps['subB'] = true;
        });
        mgTask.define('task', ['subA', 'subB'], function() {
            steps['task'] = true;
        });
        mgTask.run(function(err) {
            steps['subA'].should.be.true;
            steps['subB'].should.be.true;
            steps['task'].should.be.true;
            done(err);
        });
    });

});