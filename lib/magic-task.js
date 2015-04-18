/**
 * magic-task
 * https://github.com/iMumuMua/magic-task
 */

(function() {

    'use strict';

    /**
     * @class MagicTask
     * @description define tasks and run
     */
    var MagicTask = function() {
        this._taskList = [];
    };

    MagicTask.prototype.define = function() {
        if (arguments.length < 2) {
            throw new Error('It needs 2 arguments at least to define a task.');
        }

        var task = {};
        task.name = arguments[0];
        if (arguments.length === 2) {
            task.fn = arguments[1];
        }
        else if (arguments.length > 2) {
            task.deps = arguments[1];
            task.fn = arguments[2];
        }

        if (task.deps && !(task.deps instanceof Array)) {
            throw new Error('Task dependencies should be an array.');
        }
        if (typeof task.fn !== 'function') {
            throw new Error('Task shuold be a function.');
        }

        this._taskList.push(task);
    };

    /**
     * run a task
     * @param  {String}   taskName the task name
     * @param  {Function} callback function(err, errTaskName, data) {}
     */
    MagicTask.prototype.run = function(taskName, callback) {
        var runner = new TaskRunner(this._taskList);
        runner.run(taskName, callback);
    };


    /**
     * @class TaskRunner
     * @param {Array} taskList tasks for run
     */
    var TaskRunner = function(taskList) {
        this._taskList = taskList;
        this._taskData = {};
    };

    /**
     * get task by name
     * @param  {String} taskName task name
     * @return {Object}      task Object
     */
    TaskRunner.prototype._getTask = function(taskName) {
        for (var i = 0, len = this._taskList.length; i < len; i++) {
            var task = this._taskList[i];
            if (task.name === taskName) {
                return task;
            }
        }
    };

    /**
     * run a task
     * @param  {String}   taskName task name
     * @param  {Function} callback function(err, errTaskName, data) {}
     */
    TaskRunner.prototype.run = function(taskName, callback) {
        var self = this;
        self._finishCallback = callback;
        self._run(taskName, function() {
            self._finishCallback(null, null, self._taskData);
        });
    };

    /**
     * run a task
     * @param  {String}   taskName the task name
     * @param  {Function} callback function() {}
     */
    TaskRunner.prototype._run = function(taskName, callback) {
        var self = this;
        var task = self._getTask(taskName);

        var taskCtrl = {
            hasDone: false,
            hasFail: false
        };
        taskCtrl.done = function(data) {
            if (!taskCtrl.hasDone) {
                taskCtrl.hasDone = true;
                self._taskData[task.name] = data;
                callback();
            }
        };
        taskCtrl.fail = function(err) {
            if (!taskCtrl.hasFail) {
                taskCtrl.hasFail = true;
                self._finishCallback(err, task.name);
            }
        };
        taskCtrl.async = function() {
            var err = arguments[0];
            if (err) {
                taskCtrl.fail(err);
            }
            else {
                var len = arguments.length;
                if (len === 2) {
                    taskCtrl.done(arguments[1]);
                }
                else {
                    var resDataList = [];
                    for (var i = 1; i < len; i++) {
                        resDataList.push(arguments[i]);
                    }
                    taskCtrl.done(resDataList);
                }
            }
        };
        taskCtrl.nested = function(err, errTaskName, data) {
            self._finishCallback(err, errTaskName, data);
        };

        var runThisTask = function() {
            var res = task.fn(taskCtrl, self._taskData);
            if (res && typeof res.then === 'function') {
                res.then(function(data) {
                    taskCtrl.done(data);
                }, function(err) {
                    taskCtrl.fail(err);
                });
            }
        };

        if (task.deps) {
            self._runDeps(task.deps, function() {
                runThisTask();
            });
        }
        else {
            runThisTask();
        }
    };

    /**
     * run dependencies
     * @param  {Array}   deps     dependencies
     * @param  {Function} callback function() {}
     */
    TaskRunner.prototype._runDeps = function(deps, callback) {
        var len = deps.length;
        var finishCount = 0;

        var toFinish = function() {
            finishCount++;
            if (finishCount === len) {
                callback();
            }
        };

        for (var i = 0; i < len; i++) {
            this._run(deps[i], toFinish);
        }
    };

    var magicTask = function() {
        return new MagicTask();
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