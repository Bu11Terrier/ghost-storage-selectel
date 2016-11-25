var BaseStore = require('../../../core/server/storage/base'),
    errors = require('../../../core/server/errors'),
    https = require('https'),
    Promise = require('bluebird'),
    util = require('util'),
    url = require('url'),
    fs = require("fs"),
    path = require('path');

var StorageSelectel = function(config) {
    this.XAuthUser = config.XAuthUser;
    this.XAuthKey = config.XAuthKey;
    this.XContainer = config.XContainer;

    this.protocol = config.protocol;
    this.domain = config.domain;
    this.folder = config.folder || [];

    BaseStore.call(this);
};

util.inherits(StorageSelectel, BaseStore);

StorageSelectel.prototype.auth = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        var req = https.request({
            host: 'auth.selcdn.ru',
            method: 'GET',
            path: '/',
            headers: {
                'X-Auth-User': self.XAuthUser,
                'X-Auth-Key': self.XAuthKey
            }
        }, function(res) {
            if (res.statusCode === 204) {
                self.XAuthToken = res.headers['x-auth-token'];
                self.XStorageUrl = res.headers['x-storage-url'];
                resolve();
            } else {
                reject('Selectel Storage: (auth) Forbidden');
            }
        });

        req.on('error', function (e) {
            reject('Selectel Storage: (auth) ' + e);
        });

        req.end();
    });
};

StorageSelectel.prototype.save = function(image, targetDir) {
    var self = this;

    return new Promise(function(resolve, reject) {
        return self.auth()
            .then(function() {
                return self.getUniqueFileName(self, image);
            })
            .then(function(filename) {
                var stream = fs.createReadStream(image.path),
                    req = https.request({
                        host: url.parse(self.XStorageUrl).host,
                        method: 'PUT',
                        path: '/' + self.XContainer + '/' + self.folder.join('/') + '/' + filename,
                        headers: {
                            'X-Auth-Token': self.XAuthToken,
                            'Content-Lenght': image.size
                        }
                    }, function(res) {
                        if (res.statusCode === 201) {
                            var link = {};
                            if(self.protocol) link.protocol = self.protocol;
                            if(self.domain) {
                                link.host = self.domain;
                                link.pathname = self.folder.join('/') + '/' + filename;
                            } else {
                                link.host = url.parse(self.XStorageUrl).host;
                                link.pathname = self.XContainer + '/' + self.folder.join('/') + '/' + filename;
                            }
                            resolve(url.format(link));
                        } else {
                            reject('Selectel Storage: (save) ' + res.statusCode);
                        }
                    });

                req.on('error', function (e) {
                    reject('Selectel Storage: (save) ' + e);
                });

                stream.pipe(req);

                stream.on('end', function () {
                    req.end();
                });
            })
            .catch(function(e) {
                reject(e);
            });
    });

};

StorageSelectel.prototype.exists = function(filename) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var req = https.request({
            host: url.parse(self.XStorageUrl).host,
            method: 'HEAD',
            path: '/' + self.XContainer + '/' + self.folder.join('/') + '/' + filename,
            headers: {
                'X-Auth-Token': self.XAuthToken
            }
        }, function(res) {
            if (res.statusCode === 200) {
                resolve(true);
            } else if(res.statusCode === 404) {
                resolve(false);
            } else {
                reject('Selectel Storage: (exists) ' + res.statusCode);
            }
        });

        req.on('error', function () {
            resolve(true);
        });

        req.end();
    });
};

StorageSelectel.prototype.serve = function() {
    return function(req, res, next) {
        next();
    };
};

StorageSelectel.prototype.delete = function(fileName, targetDir) {

};

StorageSelectel.prototype.getUniqueFileName = function(store, image) {
    var self = this,
        filename = store.generateFileName(8) + path.extname(image.name);

    return new Promise(function(resolve, reject) {
        return store.exists(filename).then(function (exists) {
            if (exists) {
                return store.getUniqueFileName(store, image);
            } else {
                resolve(filename);
            }
        }).catch(function (e) {
            errors.logError(e);
            reject(e);
        });
    });
};

StorageSelectel.prototype.generateFileName = function(length) {
    var alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        result = [];

    for(var i = 0; i < length; i++) {
        result.push(alphabet.charAt(Math.floor(Math.random() * alphabet.length)));
    }

    return result.join('');
};

module.exports = StorageSelectel;