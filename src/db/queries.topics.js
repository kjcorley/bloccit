const Topic = require("./models").Topics;

module.exports = {
    getAllTopics(callback){
        return Topic.all()
        .then((topics) => {
            callback(null, topics);
        })
        .catch((err) => {
            callback(err);
        })
    }
}