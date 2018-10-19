const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;

describe("#Topic", () => {

    beforeEach((done) => {
        this.topic;
        this.post;
        sequelize.sync({force: true}).then((res) => {
            Topic.create({
                title: "Expeditions to Alpha Centauri",
                description: "A compilation of reports form recent visits to the star system"
            })
            .then((topic) => {
                this.topic = topic;
                Post.create({
                    title: "My first visit to Proxima Centauri b",
                    body: "I saw some rocks",
                    topicId: this.topic.id
                })
                .then((post) => {
                    this.post = post;
                    done();
                });
            });
        });
    });

    describe("#create()", () => {
        it("should create a topic with a title and descriptions", (done) => {
            Topic.create({
                title: "SpaceX launches BFR",
                description: "The BFR has successfully launched from Cape Canaveral"
            })
            .then((topic) => {
                expect(topic.title).toBe("SpaceX launches BFR");
                expect(topic.description).toBe("The BFR has successfully launched from Cape Canaveral");
                done();
            });
        });

        it("should not create a topic with midding title and description", (done) => {
            Topic.create({
                title: "Click me!"
            })
            .then((topic) => {
                done();
            })
            .catch((err) => {
                expect(err.message).toContain("Topic.description cannot be null");
                done();
            })
        })
    });

    describe("#getPosts", () => {
        it("should return all posts associted with the topic", (done) => {
            Post.create({
                title: "I'd like to travel there",
                body: "Maybe one day",
                topicId: this.topic.id
            })
            .then((post) => {
                this.topic.getPosts()
                .then((posts) => {
                    expect(posts[0].title).toBe(this.post.title);
                    expect(posts[1].title).toBe(post.title);
                    done();
                });
            });
        });
    });
});