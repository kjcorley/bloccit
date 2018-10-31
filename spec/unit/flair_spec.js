const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Flair = require("../../src/db/models").Flair;

describe("Flair", () => {

    beforeEach((done) => {
        this.topic;
        this.flair;

        sequelize.sync({force: true}).then((res) => {
            Topic.create({
                title: "Expeditions to Alpha Centauri",
                description: "A compilation of reports from recent visits to the star system."
            })
            .then((topic) => {
                this.topic = topic;

                Flair.create({
                    tag: "travel",
                    color: "#FFF",
                    topicId: this.topic.id
                })
                .then((flair) => {
                    this.flair = flair;
                    done();
                });
            })
            .catch((err) => {
                console.log(err);
                done();
            });
        });
    });

    describe("#create()", () => {

        it("should create a flair object with a tag and assigned topic", (done) => {
            Flair.create({
                tag: "travel",
                color: "#FFF",
                topicId: this.topic.id
            })
            .then((flair) => {
                expect(flair.tag).toBe("travel");
                done();
            })
            .catch((err) => {
                console.log(err);
                done();
            });
        });

        it("should not create a flair with a missing tag", (done) => {
            Flair.create({

            })
            .then((flair) => {
                done();
            })
            .catch((err) => {
                expect(err.message).toContain("Flair.tag cannot be null");
                done();
            });
        });
    });
});