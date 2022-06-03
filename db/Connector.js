const redis = require('redis');
const { REDIS_URL } = require('../config.js');

// https://github.com/ayomidearo/node-redis-crud/blob/master/libraries/Connector.js
const Connector = {
    _redis: null,
    /**
     * @return {null}
     */
    Redis: async () => {
        if(Connector._redis == null) {
            Connector._redis = redis.createClient({ url: `redis://${REDIS_URL}` });
            await Connector._redis.connect();
            Connector._redis.on('error', err => console.log('Error Connecting to Redis: ' + err));
        }
        return Connector._redis;
    }
};
module.exports = Connector;