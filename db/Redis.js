const Connector = require('./Connector.js');

// https://github.com/ayomidearo/node-redis-crud/blob/master/libraries/Redis.js
const Redis = {
    _client: Connector.Redis(),
    
    _key_generator: (data) => {
        let keys = Object.keys(data);
        return keys[0]+':'+data[keys[0]];
    },

    add_set: (dset, callback) => {
        let key = this._key_generator(dset.key);
        this._client.hmset(key, dset.data, (err, data) => {
            if(err) {
                return callback(err)
            } else {
                return callback(true);
            }
        });
    },

    get_set: (key, field, callback) => {
        let keygen = this._key_generator(key);
        this._client.hgetall(keygen, (err, data) => {
            if(err) {
                return false;
            } else {
                if(field) {
                    data = data.field;
                }
                return callback(data);
            }
        })
    },

    delete_set: (key, callback) => {
        this._client.del(this._key_generator(key), (err, reply) => {
            if(err) {
                return false;
            } else {
                return callback(reply);
            }
        });
    }
};
module.exports = Redis;