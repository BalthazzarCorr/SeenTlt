$(() => {

    const app = Sammy('#container', function () {
        this.use('Handlebars', 'hbs');
        this.get('#/home', getWelcomePage);
        this.get('index.html', getWelcomePage);
        this.post('#/register', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let repeatPass = ctx.params.repeatPass;

            let usernameMatch = /^[A-za-z]{3,}$/.test(username);
            let passMatch = /^[A-za-z\d]{6,}$/.test(password);

            if (!usernameMatch) {
                displayNotification.showError('Username should be at least 3 char');

            } else if (!passMatch) {
                displayNotification.showError('Password should be at least 6 char')

            } else if (password !== repeatPass) {
                displayNotification.showError('Passwords must match')
            } else {
                auth.register(username, password)
                    .then((userData) => {
                        auth.saveSession(userData);
                        displayNotification.showInfo('User registration successful!');
                        ctx.redirect('#/catalog');
                    })
                    .catch(displayNotification.handleError);
            }

        });
        this.post('#/login', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;

            if (username === '' || password === '') {
                displayNotification.showError('All fields should be filled')
            } else {
                auth.login(username, password)
                    .then((userData) => {
                        auth.saveSession(userData);
                        displayNotification.showInfo('Login Successful.');
                        ctx.redirect('#/catalog');
                    }).catch(displayNotification.handleError);
            }

        });
        this.get('#/logout', (ctx) => {
            auth.logout().then(() => {
                sessionStorage.clear();
                ctx.redirect('#/home')
            }).catch(displayNotification.handleError)
        });
        this.get('#/catalog', (ctx) => {

            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            postService.getAllPosts()
                .then((posts) => {
                    posts.forEach((p, i) => {
                        p.rank = i + 1;
                        p.date = calcTime(p._kmd.ect);
                        p.isAuthor = p._acl.creator === sessionStorage.getItem('userId')
                    });
                    ctx.isAuth = auth.isAuth();
                    ctx.username = sessionStorage.getItem('username');
                    ctx.posts = posts;

                    ctx.loadPartials({
                        header: './template/common/header.hbs',
                        footer: './template/common/footer.hbs',
                        navigation: './template/common/navigation.hbs',
                        postList: './template/posts/postList.hbs',
                        post: './template/posts/post.hbs'
                    }).then(function () {
                        this.partial('./template/posts/catalogPage.hbs')
                    })
                })
                .catch(displayNotification.handleError)

        });
        this.get('#/create/post', (ctx => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }
            ctx.isAuth = auth.isAuth();
            ctx.username = sessionStorage.getItem('username');

            ctx.loadPartials({
                header: './template/common/header.hbs',
                footer: './template/common/footer.hbs',
                navigation: './template/common/navigation.hbs',
            }).then(function () {
                this.partial('./template/posts/createPostPage.hbs')
            })

        }));
        this.post('#/create/post', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            let author = sessionStorage.getItem('username');
            let url = ctx.params.url;
            let imageUrl = ctx.params.imageUrl;
            let title = ctx.params.title;
            let description = ctx.params.description;

            if (title === '') {
                displayNotification.showError('Title can`t be empty ')
            } else if (url === '') {
                displayNotification.showError('Url is required')
            } else if (!url.startsWith('http')) {
                notify.showError('Url must be a valid link!');
            } else {
                postService.createPost(author, title, description, url, imageUrl)
                    .then(() => {
                        displayNotification.showInfo('Post created.');
                        ctx.redirect('#/catalog');
                    })
                    .catch(notify.handleError);
            }
        });
        this.get('#/edit/post/:postId', (ctx) => {

            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            let postId = ctx.params.postId;

            postService.getPostById(postId).then((post) => {
                ctx.isAuth = auth.isAuth();
                ctx.username = sessionStorage.getItem('username');
                ctx.post = post;

                ctx.loadPartials({
                    header: './template/common/header.hbs',
                    footer: './template/common/footer.hbs',
                    navigation: './template/common/navigation.hbs',
                }).then(function () {
                    this.partial('./template/posts/editPostPage.hbs')
                })
            })
        });
        this.post('#/edit/post', (ctx) => {
            let postId = ctx.params.postId;
            let author = sessionStorage.getItem('username');
            let url = ctx.params.url;
            let imageUrl = ctx.params.imageUrl;
            let title = ctx.params.title;
            let description = ctx.params.description;

            if (postIsValid(title, url)) {
                postService.editPost(postId, author, title, description, url, imageUrl)
                    .then(() => {
                        displayNotification.showInfo(`Post ${title} is updated`);
                        ctx.redirect('#/catalog');
                    }).catch(displayNotification.handleError)

            }
        });
        this.get('#/delete/post/:postId', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            let postId = ctx.params.postId;

            postService.deletePost(postId)
                .then(() => {
                    displayNotification.showInfo('Post deleted.');
                    ctx.redirect('#/catalog');
                })
                .catch(displayNotification.handleError);
        });
        this.get('#/posts', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }
            postService.myPosts(sessionStorage.getItem('username'))
                .then((posts) => {
                    posts.forEach((p, i) => {
                        p.rank = i + 1;
                        p.date = calcTime(p._kmd.ect);
                        p.isAuthor = p._acl.creator === sessionStorage.getItem('userId');
                    });

                    ctx.isAuth = auth.isAuth();
                    ctx.username = sessionStorage.getItem('username');
                    ctx.posts = posts;

                    ctx.loadPartials({
                        header: './template/common/header.hbs',
                        footer: './template/common/footer.hbs',
                        navigation: './template/common/navigation.hbs',
                        postList: './template/posts/postList.hbs',
                        post: './template/posts/post.hbs'
                    }).then(function () {
                        this.partial('./template/posts/myPostPage.hbs');
                    });
                })
        });
        this.get('#/details/:postId', (ctx) => {
            let postId = ctx.params.postId;

            const postPromise = postService.getPostById(postId);
            const allCommentsPromise = comments.getPostComments(postId);

            Promise.all([postPromise, allCommentsPromise])
                .then(([post, comments]) => {
                    post.date = calcTime(post._kmd.ect);
                    post.isAuthor = post._acl.creator === sessionStorage.getItem('userId');
                    comments.forEach((c) => {
                        c.date = calcTime(c._kmd.ect);
                        c.commentAuthor = c._acl.creator === sessionStorage.getItem('userId');
                    });

                    ctx.isAuth = auth.isAuth();
                    ctx.username = sessionStorage.getItem('username');
                    ctx.post = post;
                    ctx.comments = comments;

                    ctx.loadPartials({
                        header: './template/common/header.hbs',
                        footer: './template/common/footer.hbs',
                        navigation: './template/common/navigation.hbs',
                        postDetails: './template/details/postDetails.hbs',
                        comment: './template/details/comment.hbs'
                    }).then(function () {
                        this.partial('./template/details/postDetailsPage.hbs');
                    })
                })
                .catch(notify.handleError);
        });
        this.post('#/create/comment', (ctx) => {

            let author = sessionStorage.getItem('username');
            let content = ctx.params.content;
            let postId = ctx.params.postId;

            if (content === '') {
                displayNotification.showError('Cannot add empty comment !');
                return;
            }

            comments.createComment(postId, content, author)
                .then(() => {
                    displayNotification.showInfo('Comment created!');
                    ctx.redirect(`#/details/${postId}`);

                }).catch(displayNotification.showError)
        });
        this.get('#/comment/delete/:commentId/post/:postId', (ctx) => {
            let commentId = ctx.params.commentId;
            let postId = ctx.params.postId;

            comments.deleteComment(commentId)
                .then(() => {
                displayNotification.showInfo('Comment deleted');
                ctx.redirect(`#/details/${postId}`)
                }).catch(displayNotification.handleError)

        });


        function getWelcomePage(ctx) {

            if (!auth.isAuth()) {
                ctx.loadPartials({
                    header: './template/common/header.hbs',
                    footer: './template/common/footer.hbs',
                    loginForm: './template/forms/loginForm.hbs',
                    registerForm: './template/forms/registerForm.hbs'
                }).then(function () {
                    this.partial('./template/welcome-anonym.hbs')
                })
            } else {
                ctx.redirect('#/catalog')
            }
        }

        function calcTime(dateIsoFormat) {
            let diff = new Date - (new Date(dateIsoFormat));
            diff = Math.floor(diff / 60000);
            if (diff < 1) return 'less than a minute';
            if (diff < 60) return diff + ' minute' + pluralize(diff);
            diff = Math.floor(diff / 60);
            if (diff < 24) return diff + ' hour' + pluralize(diff);
            diff = Math.floor(diff / 24);
            if (diff < 30) return diff + ' day' + pluralize(diff);
            diff = Math.floor(diff / 30);
            if (diff < 12) return diff + ' month' + pluralize(diff);
            diff = Math.floor(diff / 12);
            return diff + ' year' + pluralize(diff);

            function pluralize(value) {
                if (value !== 1) return 's';
                else return '';
            }
        }

        function postIsValid(title, url) {
            if (title === '') {
                notify.showError('Title is required!');
            } else if (url === '') {
                notify.showError('Url is required!');
            } else if (!url.startsWith('https:')) {
                notify.showError('Url must be a valid link!');
            } else {
                return true;
            }

            return false;
        }
    });


    app.run();
});