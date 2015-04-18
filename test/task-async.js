var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper-func');

describe('task.async', function() {

    it('should run', function(done) {
        var mgTask = magicTask();
        mgTask.define('async', function(task) {
            helper.asyncFunc(10, false, task.async);
        });
        mgTask.define('res', ['async'], function(task, data) {
            data['async'].should.equal(10);
            task.done();
        })
        mgTask.run('res', done);
    });

    it('should finish only once', function(done) {
        var mgTask = magicTask();
        mgTask.define('taskA', function(task) {
            helper.asyncFunc(10, false, task.async);
            helper.asyncFunc(20, false, task.async);
        });
        mgTask.define('taskB', ['taskA'], function(task, data) {
            data['taskA'].should.equal(10);
            task.done();
        });
        mgTask.run('taskB', done);
    });

    it('should get multi data', function(done) {
        var mgTask = magicTask();
        mgTask.define('async', function(task) {
            helper.asyncMultiFunc(10, false, task.async);
        });
        mgTask.define('res', ['async'], function(task, data) {
            data['async'].length.should.equal(3);
            data['async'][0].should.equal(10);
            data['async'][1].should.equal(10 * 2);
            data['async'][2].should.equal(10 * 3);
            task.done();
        })
        mgTask.run('res', done);
    });

});