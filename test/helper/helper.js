// test helper

exports.createAsyncFunc = function(isMultiArgs, isFail) {
    if (isMultiArgs === undefined || isMultiArgs === null) {
        isMultiArgs = false;
    }
    if (isFail === undefined || isFail === null) {
        isFail = false;
    }
    if (isMultiArgs) {
        return function(dataA, dataB, dataC, callback) {
            if (isFail) {
                callback(new Error('async error'));
            }
            else {
                callback(null, dataA, dataB, dataC);
            }
        };
    }
    else {
        return function(data, callback) {
            if (isFail) {
                callback(new Error('async error'));
            }
            else {
                callback(null, data);
            }
        };
    }
}

exports.createPromise = function(data, isFail) {
    var promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            if (isFail) {
                reject(new Error('promise error'));
            }
            else {
                resolve(data);
            }
        });
    });
    return promise;
};