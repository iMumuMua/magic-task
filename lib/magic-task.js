/**
 * magic-task
 * https://github.com/iMumuMua/magic-task
 */

'use strict';

var magicTask = {};

var defer = function() {
    var deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
};

var runTask = function(task, data) {
    var self = this;
    var taskDeferred = defer();

    var taskCtrl = {
        _reDefineDone: false,
        _done: taskDeferred.resolve,
        fail: taskDeferred.reject
    };

    Object.defineProperty(taskCtrl, 'done', {
        get: function() {
            return this._done;
        },
        set: function(fn) {
            this._reDefineDone = true;
            this._done = fn;
        }
    });
    taskCtrl.async = function() {
        var err = arguments[0];
        if (err instanceof Error) {
            taskDeferred.reject(err);
        }
        else {
            var dataStartIndex = 1;
            if (err !== undefined && err !== null) {
                dataStartIndex = 0;
            }
            var resData = [];
            for (var i = dataStartIndex, len = arguments.length; i < len; i++) {
                resData.push(arguments[i]);
            }
            if (resData.length === 1) {
                resData = resData[0];
            }
            taskDeferred.resolve(resData);
        }
    };
    taskCtrl.send = function(data) {
        return function(err) {
            if (err) {
                taskDeferred.reject(err);
            }
            else {
                taskDeferred.resolve(data);
            }
        }
    };

    try {
        task(taskCtrl, data);
    }
    catch (e) {
        taskDeferred.reject(e);
        return taskDeferred.promise;
    }

    var dealPromise = function(promise) {
        if (taskCtrl._reDefineDone) {
            return promise.then(function(resData) {
                var doneData = taskCtrl.done(resData);
                return new Promise(function(resolve) {
                    resolve(doneData);
                });
            });
        }
        else {
            return promise;
        }
    };

    if (taskCtrl.promise) {
        return dealPromise(taskCtrl.promise);
    }
    else {
        return dealPromise(taskDeferred.promise);
    }
};

magicTask.run = function(task) {
    return runTask(task);
};

magicTask.waterfall = function(taskList) {
    return new Promise(function(resolve, reject) {
        var len = taskList.length;
        var nowIndex = 0;
        var next = function(data) {
            if (nowIndex < len - 1) {
                nowIndex++;
                return runTask(taskList[nowIndex], data);
            }
            else {
                resolve(data);
            }
        };
        var resPromise = runTask(taskList[0]);
        for (var i = 0; i < len; i++) {
            resPromise = resPromise.then(next);
        }
        resPromise.then(null, reject);
    });
};

magicTask.parallel = function(taskList) {
    return new Promise(function(resolve, reject) {
        var len = taskList.length;
        var finishCount = 0;
        var resData = new Array(len);
        var finish = function(index, data) {
            resData[index] = data;
            finishCount++;
            if (finishCount === len) {
                resolve(resData);
            }
        };
        for (var i = 0; i < len; i++) {
            (function(i) {
                runTask(taskList[i]).then(function(data) {
                    finish(i, data);
                }, reject);
            })(i);
        }
    });
};

magicTask.each = function(array, iterTask) {
    return new Promise(function(resolve, reject) {
        var len = array.length;
        var nowIndex = 0;
        var resData = new Array(len);
        var next = function(data) {
            if (nowIndex < len - 1) {
                resData[nowIndex] = data;
                nowIndex++;
                return runTask(iterTask, array[nowIndex]);
            }
            else {
                resData[nowIndex] = data;
                resolve(resData);
            }
        };
        var resPromise = runTask(iterTask, array[0]);
        for (var i = 0; i < len; i++) {
            resPromise = resPromise.then(next);
        }
        resPromise.then(null, reject);
    });
};

magicTask.map = function(array, iterTask) {
    return new Promise(function(resolve, reject) {
        var len = array.length;
        var finishCount = 0;
        var resData = new Array(len);
        var finish = function(index, data) {
            resData[index] = data;
            finishCount++;
            if (finishCount === len) {
                resolve(resData);
            }
        };
        for (var i = 0; i < len; i++) {
            (function(i) {
                runTask(iterTask, array[i]).then(function(data) {
                    finish(i, data);
                }, reject);
            })(i);
        }
    });
};

magicTask.whilst = function(condTask, loopTask) {
    return new Promise(function(resolve, reject) {
        function _while(loopData) {
            runTask(condTask).then(function(condData) {
                if (condData) {
                    runTask(loopTask, loopData).then(_while, reject);
                }
                else {
                    resolve();
                }
            }, reject);
        }
        _while();
    });
};

magicTask.doWhilst = function(loopTask, condTask) {
    return new Promise(function(resolve, reject) {
        function _do(loopData) {
            runTask(loopTask, loopData).then(function(data) {
                runTask(condTask).then(function(condData) {
                    if (condData) {
                        _do(data);
                    }
                    else {
                        resolve();
                    }
                }, reject);
            }, reject);
        }
        _do();
    });
};

module.exports = magicTask;