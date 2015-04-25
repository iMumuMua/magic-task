var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper');

var now = Date.now();

var startTask = function(task) {
    task.done(now);
};

var createAsyncTask = function(callback, delay) {
    return function(task, data) {
        var asyncFunc = helper.createAsyncFunc();
        asyncFunc(data, task.async);
        task.done = function(data) {
            if (callback) {
                callback();
            }
            return data;
        };
    };
};

var createAsyncFailTask = function(callback) {
    return function(task, data) {
        var asyncFunc = helper.createAsyncFunc(false, true);
        asyncFunc(data, task.async);
        task.done = function(data) {
            if (callback) {
                callback();
            }
            return data;
        };
    };
};

var createPromiseTask = function(callback, delay) {
    return function(task, data) {
        task.promise = helper.createPromise(data);
        task.done = function(data) {
            if (callback) {
                callback();
            }
            return data;
        }
    };
};

var createPromiseFailTask = function(callback) {
    return function(task, data) {
        task.promise = helper.createPromise(data, true);
        task.done = function(data) {
            if (callback) {
                callback();
            }
            return data;
        }
    };
};

describe('magic runner', function() {

    describe('run', function() {
        it('has test fully in atom task test', function() {});
    });

    describe('waterfall', function() {
        it('should run task one by one', function(done) {
            var step = {};
            var asyncTask = createAsyncTask(function() {
                step.async = true;
            });
            var promiseTask = createPromiseTask(function() {
                step.async.should.be.true;
                step.promise = true;
            });
            magicTask.waterfall([startTask, asyncTask, promiseTask]).then(function(data) {
                data.should.equal(now);
                step.async.should.be.true;
                step.promise.should.be.true;
                done();
            }, done);
        });

        it('should catch error when a task fail', function(done) {
            var step = {};
            var asyncTask = createAsyncFailTask(function() {
                step.async = true;
            });
            var promiseTask = createPromiseTask(function() {
                step.async.should.be.true;
                step.promise = true;
            });
            magicTask.waterfall([startTask, asyncTask, promiseTask]).then(function(data) {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe.skip('parallel', function() {
        it('should run task parallelly', function(done) {
            var step = {};
            var asyncTask = createAsyncTask(function() {
                step.promise.should.be.true;
                step.async = true;
            }, 20);
            var promiseTask = createPromiseTask(function() {
                step.promise = true;
            }, 10);
            magicTask.parallel([asyncTask, promiseTask]).then(function(data) {
                step.async.should.be.true;
                step.promise.should.be.true;
                done();
            }, done);
        });

        it('should catch error when a task fail', function(done) {
            var step = {};
            var asyncTask = createAsyncFailTask(function() {
                step.async = true;
            });
            var promiseTask = createPromiseTask(function() {
                step.promise = true;
            });
            magicTask.parallel([asyncTask, promiseTask]).then(function(data) {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe.skip('each', function() {
        it('should iterate array item one by one', function(done) {
            var array = ['a', 'b', 'c'];
            magicTask.each(array, createAsyncTask()).then(function(data) {
                data.should.be.an.array;
                data.length.should.equal(array.length);
                for (var i = 0, len = data.length; i < len; i++) {
                    data[i].index.should.equal(i);
                    data[i].item.should.equal(array[i]);
                }
                done();
            }, done);
        });

        it('should catch error when a task fail', function(done) {
            var array = ['a', 'b', 'c'];
            magicTask.each(array, createAsyncFailTask()).then(function(data) {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe.skip('map', function() {
        it('should iterate array item parallelly', function(done) {
            var array = ['a', 'b', 'c'];
            magicTask.map(array, createAsyncTask(function() {}, 10)).then(function(data) {
                data.should.be.an.array;
                data.length.should.equal(array.length);
                for (var i = 0, len = data.length; i < len; i++) {
                    data[i].index.should.equal(i);
                    data[i].item.should.equal(array[i]);
                }
                done();
            }, done);
        });

        it('should catch error when a task fail', function(done) {
            var array = ['a', 'b', 'c'];
            magicTask.map(array, createAsyncFailTask()).then(function(data) {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe.skip('whilst', function() {
        it('should run 3 times', function(done) {
            var count = 3;
            var i = 0;
            var firstRun;
            var condTask = function(task) {
                setTimeout(function() {
                    firstRun = 'cond';
                    task.done(i < count);
                });
            };
            var loopTask = function(task) {
                var func = helper.createAsyncFunc();
                func(null, task.async);
                task.done = function(data) {
                    firstRun.should.equal('cond');
                    i++;
                };
            };
            magicTask.whilst(condTask, loopTask).then(function() {
                i.should.equal(count);
                done();
            }, done);
        });

        it('should catch error when the condTask fail', function(done) {
            var count = 3;
            var i = 0;
            var condTask = function(task) {
                setTimeout(function() {
                    task.fail(new Error('cond error'));
                });
            };
            var loopTask = function(task) {
                var func = helper.createAsyncFunc();
                func(null, task.async);
                task.done = function(data) {
                    i++;
                };
            };
            magicTask.whilst(condTask, loopTask).then(function() {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('cond error');
                done();
            });
        });

        it('should catch error when the loopTask fail', function(done) {
            var count = 3;
            var i = 0;
            var condTask = function(task) {
                setTimeout(function() {
                    task.done(i < count);
                });
            };
            var loopTask = function(task) {
                var func = helper.createAsyncFailFunc();
                func(null, task.async);
                task.done = function(data) {
                    i++;
                };
            };
            magicTask.whilst(condTask, loopTask).then(function() {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe.skip('doWhilst', function() {
        it('should run 3 times', function(done) {
            var count = 3;
            var i = 0;
            var firstRun;
            var condTask = function(task) {
                setTimeout(function() {
                    firstRun.should.equal('do');
                    task.done(i < count);
                });
            };
            var loopTask = function(task) {
                var func = helper.createAsyncFunc();
                func(null, task.async);
                task.done = function(data) {
                    firstRun = 'do';
                    i++;
                };
            };
            magicTask.doWhilst(loopTask, condTask).then(function() {
                i.should.equal(count);
                done();
            }, done);
        });

        it('should catch error when the condTask fail', function(done) {
            var count = 3;
            var i = 0;
            var condTask = function(task) {
                setTimeout(function() {
                    task.fail(new Error('cond error'));
                });
            };
            var loopTask = function(task) {
                var func = helper.createAsyncFunc();
                func(null, task.async);
                task.done = function(data) {
                    i++;
                };
            };
            magicTask.doWhilst(loopTask, condTask).then(function() {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('cond error');
                done();
            });
        });

        it('should catch error when the loopTask fail', function(done) {
            var count = 3;
            var i = 0;
            var condTask = function(task) {
                setTimeout(function() {
                    task.done(i < count);
                });
            };
            var loopTask = function(task) {
                var func = helper.createAsyncFailFunc();
                func(null, task.async);
                task.done = function(data) {
                    i++;
                };
            };
            magicTask.doWhilst(loopTask, condTask).then(function() {
                should(true).be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

});