const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/advertisements/";
const sequelize = require("../../src/db/models/index").sequelize;
const Advertisement = require("../../src/db/models").Advertisement;

describe("routes : advertisements", () => {
    beforeEach((done) => {
        this.advertisement;
        sequelize.sync({force:true}).then((res) => {
            Advertisement.create({
                title: "Premium hosting",
                description: "Quality hosting at great prices"
            })
            .then((advertisement) => {
                this.advertisement = advertisement;
                done();
            })
            .catch((err) => {
                console.log(err);
                done();
            });
        });
    });

    describe("GET /advertisements", () => {
        it("should return status code 200 and all topics", (done) => {
            request.get(base, (err, res, body) => {
                expect(res.statusCode).toBe(200);
                expect(err).toBeNull();
                expect(body).toContain("Advertisements");
                expect(body).toContain("Premium hosting");
                done();
            });
        });
    });

    describe("GET /advertisements/new", () => {
        it("should render a new advertisement form", (done) => {
            request.get(`${base}new`, (err, res, body) => {
                expect(err).toBeNull();
                expect(body).toContain("New Advertisement");
                done();
            })
        })
    })

    describe("GET /advertisements/new", () => {
        const options ={
            url: `${base}create`,
            form: {
                title: "20% off",
                description: "Special deals today only"
            }
        };

        it("should create a new topic and redirect", (done) => {
            request.post(options,
                (err, res, body) => {
                    Advertisement.findOne({where: {title: "20% off"}})
                    .then((advertisement) => {
                        expect(res.statusCode).toBe(303);
                        expect(advertisement.title).toBe("20% off");
                        expect(advertisement.description).toBe("Special deals today only");
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

    describe("GET /advertisements/:id", () => {
        it("should render a view with the selected advertisement", (done) => {
            request.get(`${base}${this.advertisement.id}`, (err, res, body) => {
                expect(err).toBeNull();
                expect(body).toContain("Premium hosting");
                done();
            });
        });
    });

    describe("GET /advertisements/:id/destroy", () => {
        it("should delete the adveristement with the assocaited id", (done) => {
            Advertisement.all()
            .then((advertisements) => {
                const advertismentCountBeforeDelete = advertisements.length;
                expect(advertismentCountBeforeDelete).toBe(1);
                request.post(`${base}${this.advertisement.id}/destroy`, (err, res, body) => {
                    Advertisement.all()
                    .then((advertisements) => {
                        expect(err).toBeNull();
                        expect(advertisements.length).toBe(advertismentCountBeforeDelete - 1);
                        done();
                    });
                });
            });
        });
    });

    describe("GET /advertisements/:id/edit", () => {
        it("should render a view with an edit advertisement form", (done) => {
            request.get(`${base}${this.advertisement.id}/edit`, (err, res, body) => {
                expect(err).toBeNull();
                expect(body).toContain("Edit Advertisement");
                expect(body).toContain("Premium hosting");
                done();
            })
        })
    })

    describe("GET /advertisements/:id/update", () => {
        it("should update the advertisement with the given value", (done) => {
            const options = {
                url: `${base}${this.advertisement.id}/update`,
                form: {
                    title: "Discount hosting",
                    description: "Hosting on sale today"
                }
            };

            request.post(options, (err, res, body) => {
                expect(err).toBeNull();
                Advertisement.findOne({
                    where: {id: this.advertisement.id}
                })
                .then((advertisment) => {
                    expect(advertisment.title).toBe("Discount hosting");
                    done();
                });
            });
        }) ;
    });
});