var magicTask = require('../lib/magic-task');
var helper = require('./helper/helper');

var now = Date.now();

var startTask = function(task) {
    task.done(now);
};

var createAsyncTask = function(callback, delay) {
    return function(task, data) {
        var asyncFunc = helper.createAsyncFunc(false, false, delay);
        asyncFunc(data, task.async);
        task.done = function(data) {
            if (callback) {
                callback(data);
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
                callback(data);
            }
            return data;
        };
    };
};

var createPromiseTask = function(callback, delay) {
    return function(task, data) {
        task.promise = helper.createPromise(data, false, delay);
        task.done = function(data) {
            if (callback) {
                callback(data);
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
                callback(data);
            }
            return data;
        }
    };
};

describe('magic runner', function() {

    describe('run', function() {
        it('should work', function(done) {
            var asyncTask = function(task, data) {
                var asyncFunc = helper.createAsyncFunc();
                asyncFunc(data, task.async);
            };
            magicTask.run(asyncTask, 'input').then(function(data) {
                data.should.equal('input');
                done();
            }, done);
        });
    });

    describe('waterfall', function() {
        it('should run task one by one', function(done) {
            var step = {};
            var asyncTask = createAsyncTask(function(data) {
                data.should.equal(now);
                step.async = true;
            });
            var promiseTask = createPromiseTask(function(data) {
                data.should.equal(now);
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

        it('should end when task return magicTask.end', function(done) {
            function asyncTask(task) {
                var asyncFunc = helper.createAsyncFunc();
                asyncFunc('async data', task.async);
                task.done = function(data) {
                    return magicTask.end;
                }
            }
            function customTask(task) {
                (true).should.be.false;
                task.done();
            }
            magicTask.waterfall([asyncTask, customTask]).then(function() {
                done();
            }, done);
        });

        it('should catch error when a task fail', function(done) {
            var step = {};
            var asyncTask = createAsyncFailTask(function(data) {
                data.should.equal(now);
                step.async = true;
            });
            var promiseTask = createPromiseTask(function(data) {
                data.should.equal(now);
                step.async.should.be.true;
                step.promise = true;
            });
            magicTask.waterfall([startTask, asyncTask, promiseTask]).then(function(data) {
                (true).should.be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe('parallel', function() {
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
                (true).should.be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe('each', function() {
        it('should iterate array item one by one', function(done) {
            var array = ['a', 'b', 'c'];
            magicTask.each(array, createAsyncTask()).then(function(data) {
                data.should.be.an.array;
                data.length.should.equal(array.length);
                for (var i = 0, len = data.length; i < len; i++) {
                    data[i].should.equal(array[i]);
                }
                done();
            }, done);
        });

        it('should catch error when a task fail', function(done) {
            var array = ['a', 'b', 'c'];
            magicTask.each(array, createAsyncFailTask()).then(function(data) {
                (true).should.be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe('map', function() {
        it('should iterate array item parallelly', function(done) {
            var array = ['a', 'b', 'c'];
            magicTask.map(array, createAsyncTask(function() {}, 10)).then(function(data) {
                data.should.be.an.array;
                data.length.should.equal(array.length);
                for (var i = 0, len = data.length; i < len; i++) {
                    data[i].should.equal(array[i]);
                }
                done();
            }, done);
        });

        it('should catch error when a task fail', function(done) {
            var array = ['a', 'b', 'c'];
            magicTask.map(array, createAsyncFailTask()).then(function(data) {
                (true).should.be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe('whilst', function() {
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
            var loopTask = function(task, data) {
                if (i > 0) {
                    data.should.equal('loopTaskData')
                }
                var func = helper.createAsyncFunc();
                func(null, task.async);
                task.done = function(data) {
                    firstRun.should.equal('cond');
                    i++;
                    return 'loopTaskData';
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
                (true).should.be.false;
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
                var func = helper.createAsyncFunc(false, true);
                func(null, task.async);
                task.done = function(data) {
                    i++;
                };
            };
            magicTask.whilst(condTask, loopTask).then(function() {
                (true).should.be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

    describe('doWhilst', function() {
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
            var loopTask = function(task, data) {
                if (i > 0) {
                    data.should.equal('loopTaskData')
                }
                var func = helper.createAsyncFunc();
                func(null, task.async);
                task.done = function(data) {
                    firstRun = 'do';
                    i++;
                    return 'loopTaskData';
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
                (true).should.be.false;
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
                var func = helper.createAsyncFunc(false, true);
                func(null, task.async);
                task.done = function(data) {
                    i++;
                };
            };
            magicTask.doWhilst(loopTask, condTask).then(function() {
                (true).should.be.false;
                done();
            }, function(err) {
                err.message.should.equal('async error');
                done();
            });
        });
    });

});