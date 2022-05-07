const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const passport = require('passport');
const localstrategy = require('passport-local');
const flash = require('connect-flash');
const User = require('./models/users');
const Patient = require('./models/patients');
const Specialty = require('./models/specialties');

const apperror = require('./apperror');

const catchAsync = require('./catchAsync');

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.use('/public', express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));



mongoose.connect('mongodb+srv://healthe:1234@cluster0.ar5ex.mongodb.net/healthe?retryWrites=true&w=majority');
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log('Database connected');
})




const session = require('express-session');
const { isLoggedIn } = require('./middleware');

const sessionOptions = {
    secret: 'thisisnotagoodsecret', resave: false, saveUninitialized: true,
    cookie: {
        expires: Date.now() + 500000000,
        maxAge: 500000000, httpOnly: true
    }
}
app.use(flash());





app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {

    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


app.get('/', (req, res) => {
    res.render('home');
})


app.get('/users/register', (req, res) => {
    res.render('users/create')
})

app.get('/users/login', (req, res) => {
    res.render('users/login')
})
app.get('/myprofile', isLoggedIn, catchAsync(async (req, res) => {

    if (req.user.usertype == 0) {

        const profiledetails = await Patient.findOne({ 'user': `${req.user._id}` });

        res.render('users/showpatientinfo', { profiledetails });
    }

}))
app.get('/newprofile', (req, res) => {
    if (req.user.usertype == 0) {
        res.render('users/patientprofile');
    }
    else res.render('users/doctorprofile');
})
app.post('/patientprofile', catchAsync(async (req, res) => {

    const newpat = await new Patient(req.body);
    newpat.user = req.user._id;
    newpat.save();

    res.redirect('/specialties');

}))

app.get('/myprofile/:patientid/update', isLoggedIn, catchAsync(async (req, res) => {
    const requiredpatient = await Patient.findById(req.params.patientid);

    res.render('users/updatepatientinfo', { requiredpatient });
}))

app.put('/myprofile/:patientid', isLoggedIn, catchAsync(async (req, res) => {
    const kal = req.params.patientid;
    console.log(req.body);
    await Patient.findByIdAndUpdate(req.params.patientid, req.body, { runValidators: true });

    res.redirect('/myprofile');
}))

app.get('/specialties', catchAsync(async (req, res) => {

    const specialties = await Specialty.find();
    res.render('appointments/specialties', { specialties });

}))
app.get('/specialties/:specialtyid', catchAsync(async (req, res) => {

    const specialty = await Specialty.findbyid(req.params.specialtyid).populate('doctors');
    res.render('appointments/show', { specialty });

}))

app.post('/register', catchAsync(async (req, res) => {
    try {
        const { email, username, password, usertype } = req.body;
        const user = new User({ email, username, usertype });
        const registereduser = await User.register(user, password);
        req.login(registereduser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Health-E!');
            res.redirect('/newprofile');
        })
    }
    catch (err) {
        req.flash('error', err.message);
        res.redirect('/users/register');
    }
}))
app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/users/login' }), catchAsync(async (req, res) => {
    try {
        if (req.user.usertype == 1)
            req.flash('success', 'welcome back Doctor!');
        else req.flash('success', 'welcome back Patient!');

        const redirectUrl = req.session.returnTo || '/specialties';
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    }
    catch (err) {
        req.flash('error', 'Invalid Credentials');

    }
}))









app.get('/logout', catchAsync(async (req, res) => {
    req.logout();
    res.redirect('/users/login');
}))



app.all('*', (req, res, next) => {
    next(new apperror('page not found', 404));
})

app.use((err, req, res, next) => {
    const { status1 = 500, } = err;
    if (!err.message)
        err.message = 'something went wrong';
    res.status(status1).render('error', { err })
})





app.listen(3000, () => {
    console.log('serving on port 3000');
})














