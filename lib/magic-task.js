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

            task(taskCtrl, data);

            if (taskCtrl.promise) {
                taskCtrl.kind = 'promise';
                taskCtrl.promise.then(function(resData) {
                    var doneData = taskCtrl.done(resData);
                    resolve(doneData);
                }, reject);
            }
        });
        if (taskCtrl.kind !== 'promise') {
            var resPromise = new Promise(function(resolve, reject) {
                promise.then(function(resData) {
                    var doneData = resData;
                    if (taskCtrl.kind === 'async') {
                        doneData = taskCtrl.done(resData);
                    }
                    resolve(doneData);
                }, reject);
            });
            return resPromise;
        }
        else {
            return promise;
        }
    };

    magicTask.run = function(task) {
        return runTask(task);
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