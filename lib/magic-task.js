/**
 * magic-task
 * https://github.com/iMumuMua/magic-task
 */

(function() {

    'use strict';

    var magicTask = {};

    var runTask = function(task, data) {
        var self = this;
        var taskCtrl = {
            kind: 'custom'
        };
        var promise = new Promise(function(resolve, reject) {
            taskCtrl.done = function(data) {
                if (taskCtrl.kind === 'custom') {
                    resolve(data);
                }
                else {
                    return data;
                }
            };
            taskCtrl.fail = function(err) {
                reject(err);
            };
            taskCtrl.async = function() {
                taskCtrl.kind = 'async';
                var err = arguments[0];
                if (err instanceof Error) {
                    reject(err);
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
                    resolve(resData);
                }
            };

            try {
                task(taskCtrl, data);
            }
            catch (e) {
                reject(e);
                return;
            }

            if (taskCtrl.promise) {
                taskCtrl.kind = 'promise';
                taskCtrl.promise.then(function(resData) {
                    var doneData = taskCtrl.done(resData);
                    resolve(doneData);
                }, reject);
            }
        });
        if (taskCtrl.kind !== 'promise') {
            return new Promise(function(resolve, reject) {
                promise.then(function(resData) {
                    var doneData = resData;
                    if (taskCtrl.kind === 'async') {
                        doneData = taskCtrl.done(resData);
                    }
                    resolve(doneData);
                }, reject);
            });
        }
        else {
            return promise;
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

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = magicTask;
    }
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function() {
            return magicTask;
        });
    }
    else {
        this.magicTask = magicTask;
    }

}());