const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/topics";

const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;
const User = require("../../src/db/models").User;

describe("routes : static", () => {

    beforeEach((done) => {
        this.topic;
        this.post;
        this.user;

        sequelize.sync({force: true}).then((res) => {
            User.create({
                email: "starman@tesla.com",
                password: "Trekkie4lyfe"
            })
            .then((user) => {
                this.user = user;

            Topic.create({
                title: "Winter Games",
                description: "Post your Winter Games stories.",
                posts: [{
                  title: "Snowball Fighting",
                  body: "So much snow!",
                  userId: this.user.id
                }]
              }, {
                include: {
                 model: Post,
                 as: "posts"
                }
              })
              .then((topic) => {
                this.topic = topic;
                this.post = topic.posts[0];
                done();
              })
            })
        });
    });

    describe("guest user performing CRUD actions for post", () => {

        beforeEach((done) => {
            request.get({
                url: "http://localhost:3000/auth/fake/",
                form: {
                    userId: 0
                }
            }, (err, res, body) => {
                done();
                }
            );
        });

        describe("GET /topics/:topicId/posts/new", () => {
            it("should redirect to show topic view", (done) => {
                request.get(`${base}/${this.topic.id}/posts/new`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).toContain(this.topic.title);
                    done();
                });
            });
        });
    
        describe("POST /topics/:topicId/posts/create", () => {
            it("should not create a new post and redirect", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/create`,
                    form: {
                        title: "Watching snow melt",
                        body: "Without a doubt my favorite things to do besides watching paint dry!"
                    }
                };
                request.post(options,
                    (err, res, body) => {
                        Post.findOne({where: {title: "Watching snow melt"}})
                        .then((post) => {
                            expect(post).toBeNull();
                            done();
                        })
                        .catch((err) => {
                            console.log(err);
                            done();
                        });
                    }
                );
            });
    
            it("should not create a new post that fails validations", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/create`,
                    form: {
                        title: 'a',
                        body: 'b'
                    }
                };
    
                request.post(options, 
                    (err, res, body) => {
                        Post.findOne({where: {title: "a"}})
                        .then((post) => {
                            expect(post).toBeNull();
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
    
        describe("GET /topic/:topicId/posts/:id", () => {
            it("should render a view with the selected post", (done) => {
                request.get(`${base}/${this.topic.id}/posts/${this.post.id}`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).toContain("Snowball Fighting");
                    done();
                });
            });
        });
    
        describe("POST /topics/:topicId/posts/:id/destroy", () => {
            it("should not delete the post with the associated ID", (done) => {
                expect(this.post.id).toBe(1);
                request.post(`${base}/${this.topic.id}/posts/${this.post.id}/destroy`, (err, res, body) => {
                    Post.findById(1)
                    .then((post) => {
                        expect(err).toBeNull();
                        expect(post).not.toBeNull();
                        done();
                    })
                })
            });
        });
    
        describe("GET /topics/:topicId/posts/:id/edit", () => {
            it("should not render a view with an edit post form", (done) => {
                request.get(`${base}/${this.topic.id}/posts/${this.post.id}/edit`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).not.toContain("Edit Post");
                    expect(body).toContain("Snowball Fighting");
                    done();
                })
            })
        })
    
        describe("POST /topics/:topicId/post/:id/update", () => {
    
            it("should not update the post with the given values", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
                    form: {
                        title: "Snowman Building Competition",
                        body: "I love watching them melt snow"
                    }
                };
                request.post(options,
                    (err, res, body) => {
                    expect(err).toBeNull();
                    Post.findOne({
                        where: {id: this.post.id}
                    })
                    .then((post) => {
                        expect(post.title).toBe("Snowball Fighting");
                        done();
                    });
                });
            });
        });
    });

    describe("member user performing CRUD operations for Post", () => {
        beforeEach((done) => {
            this.member;
            this.ownedPost;
            User.create({
                email: "member@member.com",
                password: "123456",
                role: "member"
            })
            .then((user) => {
                this.member = user;
                Post.create({
                    title: "Just my opinion",
                    body: "It's too cold outside",
                    topicId: this.topic.id,
                    userId: this.member.id
                })
                .then((post) => {
                    this.ownedPost = post;
                    request.get({
                        url: "http://localhost:3000/auth/fake",
                        form: {
                            role: this.member.role,
                            userId: this.member.id,
                            email: this.member.email
                        }
                    },
                        (err, res, body) => {
                            done();
                        }
                    );
                })

            })
        });

        describe("GET /topics/:topicId/posts/new", () => {
            it("should render a new post form", (done) => {
                request.get(`${base}/${this.topic.id}/posts/new`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).toContain("New Post");
                    done();
                });
            });
        });
    
        describe("POST /topics/:topicId/posts/create", () => {
            it("should create a new post and redirect", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/create`,
                    form: {
                        title: "Watching snow melt",
                        body: "Without a doubt my favorite things to do besides watching paint dry!"
                    }
                };
                request.post(options,
                    (err, res, body) => {
                        Post.findOne({where: {title: "Watching snow melt"}})
                        .then((post) => {
                            expect(post).not.toBeNull();
                            expect(post.title).toBe("Watching snow melt");
                            expect(post.body).toBe("Without a doubt my favorite things to do besides watching paint dry!");
                            expect(post.topicId).not.toBeNull();
                            done();
                        })
                        .catch((err) => {
                            console.log(err);
                            done();
                        });
                    }
                );
            });
    
            it("should not create a new post that fails validations", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/create`,
                    form: {
                        title: 'a',
                        body: 'b'
                    }
                };
    
                request.post(options, 
                    (err, res, body) => {
                        Post.findOne({where: {title: "a"}})
                        .then((post) => {
                            expect(post).toBeNull();
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
    
        describe("GET /topic/:topicId/posts/:id", () => {
            it("should render a view with the selected post", (done) => {
                request.get(`${base}/${this.topic.id}/posts/${this.post.id}`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).toContain("Snowball Fighting");
                    done();
                });
            });
        });
    
        describe("POST /topics/:topicId/posts/:id/destroy", () => {
            it("should not delete a post created by another user", (done) => {
                expect(this.post.id).toBe(1);
                request.post(`${base}/${this.topic.id}/posts/${this.post.id}/destroy`, (err, res, body) => {
                    Post.findById(1)
                    .then((post) => {
                        expect(err).toBeNull();
                        expect(post).not.toBeNull();
                        done();
                    })
                })
            });

            it("should delete a post owned", (done) => {
                expect(this.ownedPost.id).toBe(2);
                request.post(`${base}/${this.topic.id}/posts/${this.ownedPost.id}/destroy`, (err, res, body) => {
                    Post.findById(2)
                    .then((post) => {
                        expect(err).toBeNull();
                        expect(post).toBeNull();
                        done();
                    })
                })
            });
        });
    
        describe("GET /topics/:topicId/posts/:id/edit", () => {
            it("should not render a view with an edit post for a post owned by another user", (done) => {
                request.get(`${base}/${this.topic.id}/posts/${this.post.id}/edit`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).not.toContain("Edit Post");
                    expect(body).toContain("Snowball Fighting");
                    done();
                })
            })

            it("should render a view with an edit post for a post owned", (done) => {
                request.get(`${base}/${this.topic.id}/posts/${this.ownedPost.id}/edit`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).toContain("Edit Post");
                    expect(body).toContain("Just my opinion");
                    done();
                })
            })
        })
    
        describe("POST /topics/:topicId/post/:id/update", () => {
    
            it("should not update a post owned by another user", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
                    form: {
                        title: "Snowman Building Competition",
                        body: "I love watching them melt snow"
                    }
                };
                request.post(options,
                    (err, res, body) => {
                    expect(err).toBeNull();
                    Post.findOne({
                        where: {id: this.post.id}
                    })
                    .then((post) => {
                        expect(post.title).toBe("Snowball Fighting");
                        done();
                    });
                });
            });

            it("should update a post owned", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/${this.ownedPost.id}/update`,
                    form: {
                        title: "Snowman Building Competition",
                        body: "I love watching them melt snow"
                    }
                };
                request.post(options,
                    (err, res, body) => {
                    expect(err).toBeNull();
                    Post.findOne({
                        where: {id: this.ownedPost.id}
                    })
                    .then((post) => {
                        expect(post.title).toBe("Snowman Building Competition");
                        done();
                    });
                });
            });
        });
    });


    describe("admin user performing CRUD operations on Post", () => {
        beforeEach((done) => {
            User.create({
                email: "admin@example.com",
                password: "123456",
                role: "admin"
            })
            .then((user) => {
                request.get({
                    url: "http://localhost:3000/auth/fake",
                    form: {
                        role: user.role,
                        userId: user.id,
                        email: user.email
                    }
                },
                    (err, res, body) => {
                        done();
                    }
                );
            });
        });

        describe("GET /topics/:topicId/posts/new", () => {
            it("should render a new post form", (done) => {
                request.get(`${base}/${this.topic.id}/posts/new`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).toContain("New Post");
                    done();
                });
            });
        });
    
        describe("POST /topics/:topicId/posts/create", () => {
            it("should create a new post and redirect", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/create`,
                    form: {
                        title: "Watching snow melt",
                        body: "Without a doubt my favorite things to do besides watching paint dry!"
                    }
                };
                request.post(options,
                    (err, res, body) => {
                        Post.findOne({where: {title: "Watching snow melt"}})
                        .then((post) => {
                            expect(post).not.toBeNull();
                            expect(post.title).toBe("Watching snow melt");
                            expect(post.body).toBe("Without a doubt my favorite things to do besides watching paint dry!");
                            expect(post.topicId).not.toBeNull();
                            done();
                        })
                        .catch((err) => {
                            console.log(err);
                            done();
                        });
                    }
                );
            });
    
            it("should not create a new post that fails validations", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/create`,
                    form: {
                        title: 'a',
                        body: 'b'
                    }
                };
    
                request.post(options, 
                    (err, res, body) => {
                        Post.findOne({where: {title: "a"}})
                        .then((post) => {
                            expect(post).toBeNull();
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
    
        describe("GET /topic/:topicId/posts/:id", () => {
            it("should render a view with the selected post", (done) => {
                request.get(`${base}/${this.topic.id}/posts/${this.post.id}`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).toContain("Snowball Fighting");
                    done();
                });
            });
        });
    
        describe("POST /topics/:topicId/posts/:id/destroy", () => {
            it("should delete the post with the associated ID", (done) => {
                expect(this.post.id).toBe(1);
                request.post(`${base}/${this.topic.id}/posts/${this.post.id}/destroy`, (err, res, body) => {
                    Post.findById(1)
                    .then((post) => {
                        expect(err).toBeNull();
                        expect(post).toBeNull();
                        done();
                    })
                })
            });
        });
    
        describe("GET /topics/:topicId/posts/:id/edit", () => {
            it("should render a view with and edit post form", (done) => {
                request.get(`${base}/${this.topic.id}/posts/${this.post.id}/edit`, (err, res, body) => {
                    expect(err).toBeNull();
                    expect(body).toContain("Edit Post");
                    expect(body).toContain("Snowball Fighting");
                    done();
                })
            })
        })
    
        describe("POST /topics/:topicId/post/:id/update", () => {
    
            it("should update the post with the given values", (done) => {
                const options = {
                    url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
                    form: {
                        title: "Snowman Building Competition",
                        body: "I love watching them melt snow"
                    }
                };
                request.post(options,
                    (err, res, body) => {
                    expect(err).toBeNull();
                    Post.findOne({
                        where: {id: this.post.id}
                    })
                    .then((post) => {
                        expect(post.title).toBe("Snowman Building Competition");
                        done();
                    });
                });
            });
        });
    })
});