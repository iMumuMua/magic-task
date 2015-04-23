// test helper

exports.createAsyncFunc = function(isMultiArgs, isFail, delay) {
    if (isMultiArgs === undefined || isMultiArgs === null) {
        isMultiArgs = false;
    }
    if (isFail === undefined || isFail === null) {
        isFail = false;
    }
    if (isMultiArgs) {
        return function(dataA, dataB, dataC, callback) {
            setTimeout(function() {
                if (isFail) {
                    callback(new Error('async error'));
                }
                else {
                    callback(null, dataA, dataB, dataC);
                }
            }, delay);
        };
    }
    else {
        return function(data, callback) {
            setTimeout(function() {
                if (isFail) {
                    callback(new Error('async error'));
                }
                else {
                    callback(null, data);
                }
            }, delay);
        };
    }
}

exports.createPromise = function(data, isFail, delay) {
    var promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            if (isFail) {
                reject(new Error('promise error'));
            }
            else {
                resolve(data);
            }
        }, delay);
    });
    return promise;
};