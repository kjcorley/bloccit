const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/topics";

const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Flair = require("../../src/db/models").Flair;


describe("routes: flair", () => {

    beforeEach((done) => {
        this.topic;
        this.flair;

        sequelize.sync({force: true}).then((res) => {
            Topic.create({
                title: "Largest cluster of deep-sea octopuses ever recorded",
                description: "cluster of 1000 octopuses discovered during California deep-sea expedition"
            })
            .then((topic) => {
                this.topic = topic;

                Flair.create({
                    tag: "science",
                    topicId: this.topic.id
                })
                .then((flair) => {
                    this.flair = flair;
                    done();
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });
            });
        });
    });

    describe("GET /topics/:topicId/flairs/new", () => {

        it("should render a new flair form", (done) => {
            console.log(this.topic.id);
            request.get(`${base}/${this.topic.id}/flairs/new`, (err, res, body) => {
                expect(err).toBeNull();
                expect(body).toContain("New Flair");
                done();
            });
        });
    });

    describe("POST /topics/:topicId/flairs/create", () => {
        it("should create a new flair and redirect", (done) => {
            const options = {
                url: `${base}/${this.topic.id}/flairs/create`,
                form: {
                    tag: "science"
                }
            };
            request.post(options,
                (err, res, body) => {
                    Flair.findOne({where: {tag: "science"}})
                    .then((flair) => {
                        expect(flair).not.toBeNull();
                        expect(flair.tag).toBe("science");
                        expect(flair.topicId).not.toBeNull();
                        done();
                    })
                    .catch((err) => {
                        console.log(err);
                        done();
                    });
                }
            );
        });
    });

    describe("POST /topics/:topicId/flairs/:id/destroy", () => {
        it("should delete the flair with the associated id", (done) => {
            expect(this.flair.id).toBe(1);

            request.post(`${base}/${this.topic.id}/flairs/${this.flair.id}/destroy`, (err, res, body) => {
                Flair.findById(1)
                .then((flair) => {
                    expect(err).toBeNull();
                    expect(flair).toBeNull();
                    done();
                });
            });
        });
    });

    describe("GET /topics/:topicId/flairs/:id?edit", () => {
        it("should render a view with an edit flair form", (done) => {
            request.get(`${base}/${this.topic.id}/flairs/${this.flair.id}/edit`, (err, res, body) => {
                expect(err).toBeNull();
                expect(body).toContain("Edit Flair");
                expect(body).toContain("science");
                done();
            });
        });
    });

    describe("POST /topics/:topicId/flairs/:id/update", () => {
        it("should return a status code 302", (done) => {
            request.post({
                url: `${base}/${this.topic.id}/flairs/${this.flair.id}/update`,
                form: {
                    tag: "marine biology"
                }
            }, (err, res, body) => {
                expect(res.statusCode).toBe(302);
                done();
            });
        });

        it("should update the flair with the new tag value", (done) => {
            const options = {
                url: `${base}/${this.topic.id}/flairs/${this.flair.id}/update`,
                form: { tag: "biology" }
            };
            request.post(options,
                (err, res, body) => {
                    expect(err).toBeNull();
                    Flair.findOne({
                        where: {id: this.flair.id}
                    })
                    .then((flair) => {
                        expect(flair.tag).toBe("biology");
                        done();
                    });
                }
            );
        });
    });
});