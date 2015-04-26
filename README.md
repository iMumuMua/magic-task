# magic-task

[![Build Status](https://travis-ci.org/iMumuMua/magic-task.svg?branch=master)](https://travis-ci.org/iMumuMua/magic-task)
[![Coverage Status](https://coveralls.io/repos/iMumuMua/magic-task/badge.svg)](https://coveralls.io/r/iMumuMua/magic-task)

magic-task可以让JavaScript异步编程更加简单、优雅、安全，它将异步任务promise化，可以做统一的错误处理，并且提供常用的流程控制，使得代码更易于组织。

## 执行环境
* node.js - v0.12.x
* node.js - v0.11.x 开启Promise功能
* io.js

## 开始
以下是执行一个典型的异步任务的例子，这个任务包含了调用异步函数获取数据和数据处理过程。
```javascript
var magicTask = require('magic-task');
var fs = require('fs');
var dealText = function(task) {
    fs.readfile('path', task.async);
    task.done(function(content) {
        console.log(content);
        return doSomething(content);
    });
};
magicTask.run(dealText).then(function(data) {
    console.log(data); // data 等于 doSomething(content)
}).then(null, function(err) {
    console.log(err);
});
```
当然，仅仅是执行这样简单的文件操作处理并不需要magic-task，直接调用异步函数将处理过程写在回调函数里即可，或是直接使用Promise。在流程稍微复杂的情况下，magic-task才慢慢显示出威力。例如需要多次数据库操作：
```javascript
var magicTask = require('magic-task');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');

var queryUser = function(task) {
    task.promise = User.findOne(opts).exec();
};
var createUserIfNot = function(task, data) {
    if (data) {
        task.done(data);
    }
    else {
        var user = new User();
        user.save(function(err) {
            if (err) {
                task.fail(err);
            }
            else {
                task.done(user);
            }
        });
    }
};
var postComment = function(task, data) {
    var comment = new Comment({
        poster: data
    });
    comment.save(task.async);
};
// 依次执行上面的任务
magicTask.waterfall([queryUser, createUserIfNot, postComment]).then(function(data) {
    // 任务全部成功后的处理
    doSomething();
}).then(null, function(err) {
    console.log(err);
});

```

## 定义任务
magic-task的一个任务是一个如下形式的函数：
```javascript
// 参数task是一个任务控制器，提供done、fail、promise、async方法，这在下面的内容中会具体介绍
// 参数data是任务接受的数据，取决于具体任务而定，例如waterfall任务中，每个任务的data是上一个任务的返回值，而each、map任务中data则是数组元素
// 任务执行完成后可以返回结果，用于某些执行方法的数据传递或是流程控制
function(task, data) {
    // 在这里定义任务
}
```
一共有3种任务类型：
### 便捷的异步任务
定义方式如下：
```javascript
function asyncTask(task, data) {
    // 调用一个异步函数，例如fs.readfile
    // 如果异步函数的回调函数形式如function([err, ][arg1[, arg2[, arg3...]]]) {}，
    // 即第一个参数为返回的错误，后面的为返回的数据，
    // 那么可以调用task.async方法，简单地处理数据并处理错误
    asyncFunction(dataArgs, task.async);

    // 定义成功后的数据处理函数（可以不写，默认返回data）
    task.done = function(data) {
        // 上面的异步函数asyncFunction执行成功后，可在这里写处理代码
        // data为获取到的数据
        // 如果上述的asyncFunction执行后的回调函数提供多个数据，则会合并到一个数组中，例如
        // asyncFunction(args, function(err, arg1, arg2) {})
        // 此时data为[arg1, arg2]
        return res; // 返回任务结果
    };
}
```
magic-task还提供另一个便捷的方法`task.send(data)`：
```javascript
function asyncTask(task) {
    // 这个方法默认asyncFunction的回调函数第一个参数为err，忽略其它参数
    // 如果没有错误，那么会将字符串'custom data'作为任务执行成功后的结果
    asyncFunction(dataArgs, task.send('custom data'));
}
```

### Promise任务
定义方法与上述的异步任务有些相似：
```javascript
function promiseTask(task, data) {
    task.promise = new Promise(function(resolve, reject) {
        if (something) {
            resolve(prData);
        }
        else {
            reject(new Error('msg'));
        }
    });

    // 定义成功后的数据处理函数（可以不写，默认返回data）
    task.done = function(data) {
        // data 等于 prData
        return res; //返回任务结果
    };
}
```

### 自定义任务
在一些特殊的异步或是同步过程时，可以使用更灵活的任务定义方式：
```javascript
function customTask(task, data) {
    setTimeout(function() {
        if (something) {
            task.done(res); // 调用task.done方法表示任务成功，（参数表示任务结果，可选）
        }
        else {
            task.fail(new Error('msg')); // 调用task.fail方法使任务失败
        }
    });
}
```

### 注意
不要在重新定义task.done后再调用task.done(res)来表示任务成功并返回结果，例如：
```javascript
function errorTask(task, data) {
    task.done = function(data) {};
    task.done(data); // 注意！！！这是错误的方法，任务并不会成功！！！
}
```

## 执行任务
定义好任务后，就可以使用magic-task的方法来执行了，magic-task可以顺序、并发、循环执行任务，还可以执行顺序或并发的数组遍历任务。magic-task提供以下的方法来执行任务：

* [`run`](#run)
* [`waterfall`](#waterfall)
* [`parallel`](#parallel)
* [`each`](#each)
* [`map`](#map)
* [`whilst`](#whilst)
* [`doWhilst`](#doWhilst)

这些方法都会返回一个Promise，如果没有特别说明，成功执行后获得的数据为最后一个任务返回的数据。

<a name="run"></a>
### run(task, data)
执行单个任务，data为传递给这个任务的数据。

__示例__

```javascript
var asyncTask = function(task, data) {
    task.done(data);
};
magicTask.run(asyncTask, 'input').then(function(data) {
    data.should.equal('input');
    done();
}, done);
```

<a name="waterfall"></a>
### waterfall(taskList)
顺序执行一系列任务，每个任务的返回结果为下一个任务`function(task, data) {}`中的参数`data`。如果taskList中的某个任务的返回结果为magicTask.end，则waterfall直接成功结束，不再执行其后面的任务。

__示例__

```javascript
var task1 = function(task, data) { task.done('taskData_1'); };
var task2 = function(task, data) {
    console.log(data); // taskData_1
    task.done('taskData_2');
};
var task3 = function(task, data) {
    console.log(data); // taskData_2
    task.done('taskData_3');
};
magicTask.waterfall([task1, task2, task3]).then(function(res) {
    console.log(data); // taskData_3
}).then(null, function(err) {});

var task4 = function(task, data) { task.done(magicTask.end); };
var task5 = function(task, data) {
    // 不会执行该任务了
    task.done('taskData_5');
};
magicTask.waterfall([task4, task5]).then(function(res) {
    // 会执行这里的代码
}).then(null, function(err) {});
```

<a name="parallel"></a>
### parallel(taskList)
并发执行一系列任务，所有任务都执行成功后才算成功，执行成功后的结果为一个数组。

__示例__

```javascript
magicTask.parallel([taskA, taskB, taskC]).then(function(res) {
    // res[0]是taskA的结果, res[1]是taskB的结果，res[2]是taskC的结果
}).then(null, function(err) {});
```

<a name="each"></a>
### each(array, iterTask)
执行遍历数组，迭代任务iterTask中`function(task, data){}`的data为数组元素，迭代任务会顺序执行，一个任务完成后才会进行下一个任务。

__示例__

```javascript
var array = [1, 2, 3];
var iterTask = function(task, data) {
    console.log(data);
    task.done();
};
magicTask.each(array, iterTask).then(function(res) {}).then(null, function(err) {});
// 会依次输出1, 2, 3
```

<a name="map"></a>
### map(array, iterTask)
执行遍历数组，迭代任务iterTask中`function(task, data){}`的data为数组元素，迭代任务会并发执行，所有任务都成功后才算执行成功，执行的结果为一个数组，类似于parallel方法。

__示例__

```javascript
var array = [1, 2, 3];
var iterTask = function(task, data) {
    asyncFunction(function() {
        console.log(data);
        task.done(data - 1);
    });
};
magicTask.map(array, iterTask).then(function(res) {
    // res为[0, 1, 2]
    // 控制台输出1, 2, 3的顺序不可预测
}).then(null, function(err) {});
```

<a name="whilst"></a>
### whilst(condTask, loopTask)
执行循环任务，第一个任务为条件判断，第二个任务为循环体，相当于`while(cond) {body}`

__示例__

```javascript
var i = 0;
var condTask = function(task) {
    setTimeout(function() {
        task.done(i < 3);
    });
};
var loopTask = function(task, data) {
    console.log(data); // 依次输出undefined, 1, 2
    i++;
    task.done(i);
};
magicTask.whilst(condTask, loopTask).then(function(res) {
    // res为3
}).then(null, function(err) {});
```

<a name="doWhilst"></a>
### doWhilst(loopTask, condTask)
执行循环任务，第一个任务为循环体，第二个任务为条件判断，相当于`do {body} while(cond);`，类似于`whilst`方法。

## License
[MIT](./LICENSE)