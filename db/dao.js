const redis = require('./Redis');

const AppDAO = {

    add_stroke: (data, callback) => {
        let extract = {
            start: data.start,
            end: data.end
        };

        redis.add_set({key: {"type": "stroke", "room": data.room}, data: extract}, (response) => {
            if(response) {
                return callback({err: false, response: 'Data was added successfully'});
            } else {
                return callback({err: true, response: 'Stroke was not added successfully'});
            }
        });
    },

    get_strokes: (room, callback) => {
        console.log({"type": "stroke", "room": room});
        // redis.get_set({"type": "stroke", "room": room}, null, (response) => {
        //     if(response) {
        //         return callback({err: false, response: "Strokes were found", data: response});
        //     } else {
        //         return callback({err: true, response: "No strokes were found in that room", data: null});
        //     }
        // });
    },

    delete_strokes: (room, callback) => {
        redis.delete_set({"type": "stroke", "room": room}, (response) => {
            if(response) {
                return callback({err: false, response: "Strokes were deleted successfully"});
            } else {
                return callback({err: true, response: 'No strokes were found in that room'});
            }
        });
    }
};
module.exports = AppDAO;