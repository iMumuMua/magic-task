var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper-func');

describe('sub task', function() {

    it('should run sub task', function(done) {
        var mgTask = magicTask();
        var steps = [false, false];
        mgTask.define('step0', function(task) {
            steps[0] = true;
            task.done();
        });
        mgTask.define('step1', ['step0'], function(task) {
            steps[1] = true;
            task.done();
        });
        mgTask.run('step1', function(err) {
            steps[0].should.be.true;
            steps[1].should.be.true;
            done(err);
        });
    });

    it('should run multi sub task', function(done) {
        var mgTask = magicTask();
        var steps = {};
        mgTask.define('subA', function(task) {
            steps['subA'] = true;
            task.done();
        });
        mgTask.define('subB', function(task) {
            helper.asyncFunc(10, false, function(err, data) {
                steps['subB'] = true;
                task.done();
            });
        });
        mgTask.define('task', ['subA', 'subB'], function(task) {
            steps['task'] = true;
            task.done();
        });
        mgTask.run('task', function(err) {
            steps['subA'].should.be.true;
            steps['subB'].should.be.true;
            steps['task'].should.be.true;
            done(err);
        });
    });

    it('should get sub task data', function(done) {
        var mgTask = magicTask();
        mgTask.define('subA', function(task) {
            task.done('dataA');
        });
        mgTask.define('subB', function(task) {
            task.done('dataB');
        });
        mgTask.define('task', ['subA', 'subB'], function(task, data) {
            data['subA'].should.equal('dataA');
            data['subB'].should.equal('dataB');
            task.done();
        });
        mgTask.run('task', done);
    });

});