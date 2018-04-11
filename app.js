$(()=>{

    const app = Sammy('#container',function () {
        this.use('Handlebars','hbs');
        this.get('#/home',getWelcomePage);
        this.get('index.html',getWelcomePage);
        this.post('#/register',(ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let repeatPass = ctx.params.repeatPass;
            let usernameMatch = /^[A-za-z]{3,}$/.test(username);
            let passMatch = /^[A-za-z\d]{6,}$/.test(password);

            if(!usernameMatch){
            notify.showError('Username should be at least 3 char');

            }else if(!passMatch){
                notify.showError('Password should be at least 6 char')

            }else if(password !== repeatPass){
                notify.showError('Passwords must match')
            }else {
                auth.register(username,password)
                    .then((userData)=>{
                        auth.saveSession(userData);
                        notify.showError('User registration successful');
                        ctx.redirect('#/catalog')
                    }).catch(notify.handleError);
            }

        });


        function getWelcomePage(ctx) {
            
            if(!auth.isAuth()){
            ctx.loadPartials({
                header:'./template/common/header.hbs',
                footer:'./template/common/footer.hbs',
                loginForm:'./template/forms/loginForm.hbs',
                registerForm:'./template/forms/registerForm.hbs'
            }).then(function () {
                this.partial('./template/welcome-anonym.hbs')
            })
            }else{
            ctx.redirect('#/catalog')
            }
        }
    });


    app.run();
});