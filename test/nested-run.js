var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper-func');

describe('nested run', function() {

    it('should receive nested running task data', function(done) {
        var mgTask = magicTask();
        mgTask.define('child', function(task) {
            task.done('child data');
        });
        mgTask.define('parent', function(task) {
            mgTask.run('child', task.nested);
        });
        mgTask.run('parent', function(err, errTaskName, data) {
            data['child'].should.equal('child data');
            done();
        });
    });

    it('should catch nested running task error', function(done) {
        var mgTask = magicTask();
        mgTask.define('child', function(task) {
            task.fail(new Error('child error'));
        });
        mgTask.define('parent', function(task) {
            mgTask.run('child', task.nested);
        });
        mgTask.run('parent', function(err, errTaskName, data) {
            err.message.should.equal('child error');
            errTaskName.should.equal('child');
            done();
        });
    });

});