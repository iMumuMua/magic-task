var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper');

describe('atom task', function() {

    describe('async task', function() {

        it('should run with default options', function(done) {
            function asyncTask(task) {
                var asyncFunc = helper.createAsyncFunc();
                asyncFunc('async data', task.async);
            }
            magicTask.run(asyncTask).then(function(data) {
                data.should.equal('async data');
                done();
            }, done);
        });

        it('should run when it has init task.done', function(done) {
            function asyncTask(task) {
                var asyncFunc = helper.createAsyncFunc();
                asyncFunc('async data', task.async);
                task.done = function(res) {
                    res.should.equal('async data');
                    res = 'asyncData';
                    return res;
                };
            }
            magicTask.run(asyncTask).then(function(data) {
                data.should.equal('asyncData');
                done();
            }, done);
        });

        it('should get multi data when the async callback provide multi data', function(done) {
            function asyncTask(task) {
                var asyncFunc = helper.createAsyncFunc(true);
                asyncFunc('dataA', 'dataB', 'dataC', task.async);
                task.done = function(res) {
                    res.should.be.an.array;
                    res.length.should.equal(3);
                    res[0].should.equal('dataA');
                    res[1].should.equal('dataB');
                    res[2].should.equal('dataC');
                    return res[0];
                };
            }
            magicTask.run(asyncTask).then(function(data) {
                data.should.equal('dataA');
                done();
            }, done);
        });

        it('should catch error when the task fail', function(done) {
            function asyncTask(task) {
                var asyncFunc = helper.createAsyncFunc(false, true);
                asyncFunc('async data', task.async);
            }
            magicTask.run(asyncTask).then(function(data) {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });

    });

    describe('promise task', function() {
        it('should run with default options', function(done) {
            function promiseTask(task) {
                task.promise = helper.createPromise('promise data');
            }
            magicTask.run(promiseTask).then(function(data) {
                data.should.equal('promise data');
                done();
            }, done);
        });

        it('should run when it has init task.done', function(done) {
            function promiseTask(task) {
                task.promise = helper.createPromise('promise data');
                task.done = function(data) {
                    data.should.equal('promise data');
                    return 'new data';
                };
            }
            magicTask.run(promiseTask).then(function(data) {
                data.should.equal('new data');
                done();
            }, done);
        });

        it('should catch error when the task fail', function(done) {
            function promiseTask(task) {
                task.promise = helper.createPromise('promise data', true);
            }
            magicTask.run(promiseTask).then(function(data) {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('promise error');
                done();
            });
        });
    });

    describe('custom task', function() {
        it('should run', function(done) {
            function customTask(task) {
                var asyncFunc = helper.createAsyncFunc();
                asyncFunc('custom data', function(err, data) {
                    if (err) {
                        task.fail(err);
                    }
                    else {
                        task.done(data);
                    }
                });
            }
            magicTask.run(customTask).then(function(data) {
                data.should.equal('custom data');
                done();
            }, done);
        });

        it('should catch error when the task fail', function(done) {
            function customTask(task) {
                var asyncFunc = helper.createAsyncFunc(false, true);
                asyncFunc('custom data', function(err, data) {
                    if (err) {
                        task.fail(err);
                    }
                    else {
                        task.done(data);
                    }
                });
            }
            magicTask.run(customTask).then(function(data) {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });

        it('should catch error when the task throw error', function(done) {
            function customTask(task) {
                throw new Error('throw error');
            }
            magicTask.run(customTask).then(function(data) {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('throw error');
                done();
            });
        });

        it('should run sync', function(done) {
            function customTask(task) {
                task.done('sync data');
            }
            magicTask.run(customTask).then(function(data) {
                data.should.equal('sync data');
                done();
            }, done);
        });
    });

});