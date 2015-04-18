# magic-task
magic-task是一个用于解决“回调地狱”的库。magic-task把异步过程抽象成一个个任务，使得逻辑清晰，易于维护；而且它的每一个任务都只会成功或失败一次；可以在一个函数中进行统一的错误处理。

## 简单示例
```javascript
var magicTask = require('magic-task');
var fs = require('fs');
var mgTask = magicTask();
mgTask.define('readFile', function(task) {
    fs.readFile('path', task.async);
});
mgTask.define('processData', ['readFile'], function(task, data) {
    var fileContent = data['readFile'];
    console.log(fileContent);
    task.done();
});
mgTask.run('processData', function(err, errTaskName, data) {
    if (err) {
        console.log(err);
    }
    else {
        // do something
    }
});
```

## 定义任务
### 一个简单的任务
```javascript
var magicTask = require('magic-task');
var mgTask = magicTask(); // 这个方法会返回一个MagicTask对象实例，这样使用mgTask对象定义的任务只属于这个对象，起到一个命名空间的作用

// 第一个参数是任务名，可以是任意的字符串
// 第二个参数是任务函数，执行任务时该函数会被调用
mgTask.define('simpleTask', function(task) {
    // task是一个任务控制器
    task.done(); // 调用task.done()方法让任务成功完成
});
```
### 一个典型的异步任务
```javascript
var magicTask = require('magic-task');
var fs = require('fs');
var mgTask = magicTask();

mgTask.define('readFile', function(task) {
    fs.readFile('filename', function(err, data) {
        if (err) {
            task.fail(err); // 任务失败
        }
        else {
            task.done(data); // 任务成功，并保存数据
        }
    });
});

// 定义一个有依赖项的任务，第二个参数为依赖的任务名称数组，会先执行完依赖的任务，再去执行该任务
mgTask.define('processData', ['readFile'], function(task, data) {
    console.log(data['readFile']); // 通过data[taskName]来访问执行过的任务保存的数据
    task.done(); // 任务成功，不保存数据
});

// 也可以使用task.async方法简化任务定义
mgTask.define('readFileSimple', function(task) {
    // task.async会认为该异步函数的回调函数第一个参数为err，后面的参数为成功后的数据
    fs.readFile('filename', task.async);
});
```
### Promise任务
使用Promise也很简单，只需要在任务函数中返回一个Promise即可
```javascript
var Q = require('q');
var magicTask = require('magic-task');
var mgTask = magicTask();
mgTask.define('promise', function() {
    return Q.fcall(function() {});
});
mgTask.define('res', ['promise'], function(task, data) {
    console.log(data['promise']);
    task.done();
});
```

### 多个依赖的子任务
如果一个任务依赖多个子任务，那么会在这些子任务执行完后，才会执行该任务。如果子任务是异步的，那么会并发执行。
```javascript
var magicTask = require('magic-task');
var mgTask = magicTask();
mgTask.define('childA', function(task) {
    setTimeout(function() {
        task.done('A');
    });
});
mgTask.define('childB', function(task) {
    setTimeout(function() {
        task.done('B');
    });
});
mgTask.define('res', ['childA', 'childB'], function(task, data) {
    console.log(data['childA'], data['childB']); // 'A', 'B'
    task.done();
});
```

## 执行任务
使用`MagicTask.prototype.define`方法定义的任务只是保存定义到该实例对象的任务列表中，并不会执行，需要执行某个任务时，需要调用`MagicTask.prototype.run`方法。
```javascript
var magicTask = require('magic-task');
var mgTask = magicTask();
/* 定义一些任务... */
// run方法的第一个参数为任务名称，第二个参数为执行完成的回调函数，无论成功或失败都会被调用且仅被调用一次
mgTask.run('someTask', function(err, errTaskName, data) {
    if (err) {
        console.log(err, errTaskName); // errTaskName是失败的任务的任务名
    }
    else {
        console.log(data) // 任务数据
    }
});
```
还可以在一个任务中执行另一个任务，这在需要按条件执行时很有用。如果希望仍然在最外层的run方法中统一处理错误，则可以调用task.nested方法。
```javascript
var magicTask = require('magic-task');
var mgTask = magicTask();
mgTask.define('task', function(task, data) {
    if (something) {
        mgTask.run('someTask', task.nested);
    }
    else {
        mgTask.run('anotherTask', task.nested);
    }
});
mgTask.define('res', ['task'], function(task, data) {
    task.done();
});
mgTask.run('res', function(err, errTaskName, data) {
    // 在这里仍可以处理所有错误，但是如果'someTask'任务失败，errTaskName为'someTask'，而不是'task'
});
```

## 任务中的数据
在一个任务中，可以将该任务的数据保存起来，也可以获取执行过的任务的数据。
```javascript
var magicTask = require('magic-task');
var mgTask = magicTask();

mgTask.define('taskA', function(task) {
    task.done('A'); // 保存数据
});
mgTask.define('taskB', ['taskA'], function(task, data) {
    console.log(data['taskA']); // 通过 data[taskName] 获取数据
});
```
当一个异步任务有多个数据时，使用task.async方法会将这些数据合并到一个数组中
```javascript
var magicTask = require('magic-task');
var mgTask = magicTask();

mgTask.define('taskA', function(task) {
    (function(callback) {
        setTimeout(function() {
            callback(null, 'A', 'B', 'C');
        });
    }(task.async));
});
mgTask.define('taskB', ['taskA'], function(task, data) {
    console.log(data['taskA'][0]); // 'A'
    console.log(data['taskA'][1]); // 'B'
});
```

## License
[MIT](./LICENSE)