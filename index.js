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
const Appointment = require('./models/appointments');

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
const doctors = require('./models/doctors');



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
    if (req.user.usertype == 1) {

        const profiledetails = await doctors.findOne({ 'user': `${req.user._id}` }).populate('specialty');

        res.render('users/showdoctorinfo', { profiledetails });
    }

}))
app.get('/newprofile', catchAsync(async (req, res) => {
    if (req.user.usertype == 0) {
        res.render('users/patientprofile');
    }
    else {
        const specialties = await Specialty.find();
        res.render('users/doctorprofile', { specialties });
    }
}))
app.post('/patientprofile', catchAsync(async (req, res) => {

    const newpat = await new Patient(req.body);
    newpat.user = req.user._id;
    newpat.save();

    res.redirect('/specialties');

}))
app.post('/doctorprofile', isLoggedIn, catchAsync(async (req, res) => {

    const newdoc = await new doctors(req.body);
    newdoc.user = req.user._id;
    console.log(req.body.selectspecialty);
    const specialty = await Specialty.findOne({ 'name': req.body.selectspecialty })
    newdoc.specialty = specialty;
    await newdoc.save();
    specialty.doctors.push(newdoc);
    await specialty.save();
    res.redirect('/specialties');

}))

app.get('/myprofile/:patientid/update', isLoggedIn, catchAsync(async (req, res) => {
    if (req.user.usertype == 0) {
        const requiredpatient = await Patient.findById(req.params.patientid);
        res.render('users/updatepatientinfo', { requiredpatient });
    }
    else {
        const requiredpatient = await doctors.findById(req.params.patientid).populate('specialty');
        res.render('users/updatedoctorinfo', { requiredpatient });

    }
}))

app.put('/myprofile/:patientid', isLoggedIn, catchAsync(async (req, res) => {

    if (req.user.usertype == 0) {

        await Patient.findByIdAndUpdate(req.params.patientid, req.body, { runValidators: true });
    }
    else {

        await doctors.findByIdAndUpdate(req.params.patientid, req.body, { runValidators: true });
    }
    res.redirect('/myprofile');
}))

//socket.on is definition of the function 'example'
//while socket.emit is kind of calling the socket.on function

const http = require("http")
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");
const socketio = require("socket.io");
const bot = 'Health-E Bot';
const server = http.createServer(app);
const io = socketio(server);



const roomsSchema = {
    room_name: String,
    chat_history: []
}
const Room = new mongoose.model("Room", roomsSchema);

// we are using http to help express work with socket io

//run when client connects
//io will listen for a event/connection
io.on("connection", function (socket) {
    socket.on('joinRoom', function ({ username, room }) {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        //it is only sent to the guy joining
        console.log("hello");
        Room.find({}, function (err, result) {
            var x = -1;
            // console.log("I am looking for room:"+user.room);
            for (var i = 0; i < result.length; i++) {
                if (result[i].room_name == user.room) {
                    x = i;
                }
            }
            if (x == -1) {
                const room1 = new Room({
                    room_name: user.room,
                    chat_history: []
                });
                room1.save();
                // console.log("creating a new room");
                socket.emit("message", formatMessage(bot, "Welcome to chat app"));
            } else {
                for (var i = 0; i < result[x].chat_history.length; i++) {
                    socket.emit("message", result[x].chat_history[i]);
                }
                socket.emit("message", formatMessage(bot, "Welcome to chat app"));
            }
        });


        //broadcast when a user connections
        //it is sent to all except the guy joining
        socket.broadcast.to(user.room).emit("message", formatMessage(bot, `${username} has joined the chat`));


        //Send users and room info from
        //server to clients
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //jesse hi client side se kuch bhi chat waale form se content
    //server pe aata hai toh hum usse baaki members ko bhi dikhana
    //chahenge, so ab hum server se firse client ko content bhej denge
    //listen for chatMessage
    socket.on("chatMessage", function (msg) {
        const user = getCurrentUser(socket.id);
        const msg1 = formatMessage(user.username, msg);

        io.to(user.room).emit("message", msg1);
        Room.find({}, function (err, res) {
            for (var i = 0; i < res.length; i++) {
                if (res[i].room_name == user.room) {
                    res[i].chat_history.push(msg1);
                    res[i].save();
                }
            }
        })
    });


    //runs when a client disconnects
    //it is sent to all
    socket.on("disconnect", function () {
        const user = userLeave(socket.id);
        // console.log(user);
        io.to(user.room).emit("message", formatMessage(bot, `${user.username} has left the chat`));
        //Send users and room info from
        //server to clients
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
});


app.get('/specialties', catchAsync(async (req, res) => {

    const specialties = await Specialty.find();
    res.render('appointments/specialties', { specialties });

}))
app.get('/specialties/:specialtyid', catchAsync(async (req, res) => {

    const specialty = await Specialty.findById(req.params.specialtyid).populate('doctors');
    if (req.isAuthenticated() && req.user.usertype == 1) {
        const curdoc = await doctors.findOne({ 'user': `${req.user._id}` });
        res.render('appointments/show', { specialty, curdoc });
    }
    else
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
            req.flash('success', 'Welcome Back, Doctor!');
        else req.flash('success', 'Welcome Back, Patient!');

        const redirectUrl = req.session.returnTo || '/specialties';
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    }
    catch (err) {
        req.flash('error', 'Invalid Credentials');

    }
}))

app.get('/book/:doctorid', isLoggedIn, catchAsync(async (req, res) => {
    const curdoc = await doctors.findById(req.params.doctorid);
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    let stdate = yyyy + '-' + mm + '-' + dd;

    Date.prototype.addDays = function (days) {
        let date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }
    let date = new Date();
    today = date.addDays(10);
    dd = String(today.getDate()).padStart(2, '0');
    mm = String(today.getMonth() + 1).padStart(2, '0');
    yyyy = today.getFullYear();
    let endate = yyyy + '-' + mm + '-' + dd;

    res.render('appointments/book', { curdoc, stdate, endate });
}))



app.post('/appointment/:doctorid', isLoggedIn, catchAsync(async (req, res) => {
    const newappt = await new Appointment(req.body);
    const curdoc = await doctors.findById(req.params.doctorid);
    const curpar = await Patient.findOne({ 'user': `${req.user._id}` });
    newappt.patient = curpar;
    newappt.doctor = curdoc;
    newappt.fee = curdoc.fee;
    await newappt.save();
    console.log(curpar);
    curdoc.myappointments.push(newappt);
    curpar.myappointments.push(newappt);
    await curdoc.save();
    await curpar.save();
    res.redirect('/myappointments');
}))

app.get('/myappointments', isLoggedIn, catchAsync(async (req, res) => {

    if (req.user.usertype == 0) {
        const curpar = await Patient.findOne({ 'user': `${req.user._id}` }).populate({
            path: 'myappointments',
            populate: {
                path: 'doctor'
            }
        });;

        res.render('appointments/myappointments', { curpar });
    }
    else {
        const curdoc = await doctors.findOne({ 'user': `${req.user._id}` }).populate({
            path: 'myappointments',
            populate: {
                path: 'patient'
            }
        });

        res.render('appointments/myappointments', { curdoc });

    }



}))
app.get('/getforupdateappointment/:appointmentid', isLoggedIn, catchAsync(async (req, res) => {

    const curap = await Appointment.findById(req.params.appointmentid).populate('doctor');
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    let stdate = yyyy + '-' + mm + '-' + dd;

    Date.prototype.addDays = function (days) {
        let date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }
    let date = new Date();
    today = date.addDays(10);
    dd = String(today.getDate()).padStart(2, '0');
    mm = String(today.getMonth() + 1).padStart(2, '0');
    yyyy = today.getFullYear();
    let endate = yyyy + '-' + mm + '-' + dd;

    today = curap.date;
    console.log(today);
    dd = String(today.getDate()).padStart(2, '0');
    mm = String(today.getMonth() + 1).padStart(2, '0');
    yyyy = today.getFullYear();
    let apdate = yyyy + '-' + mm + '-' + dd;
    console.log(apdate);
    res.render('appointments/update', { curap, apdate, stdate, endate });
}))
app.put('/updateappointment/:appointmentid', isLoggedIn, catchAsync(async (req, res) => {

    await Appointment.findByIdAndUpdate(req.params.appointmentid, req.body, { runValidators: true });
    res.redirect('/myappointments');
}))
app.delete('/deleteappointment/:appointmentid', isLoggedIn, catchAsync(async (req, res) => {
    const curappt = await Appointment.findById(req.params.appointmentid);
    await doctors.findByIdAndUpdate(curappt.doctor, { $pull: { myappointments: req.params.appointmentid } });
    await Patient.findByIdAndUpdate(curappt.patient, { $pull: { myappointments: req.params.appointmentid } });
    await Appointment.findByIdAndDelete(req.params.appointmentid);
    res.redirect('/myappointments');
}))



app.get('/logout', isLoggedIn, catchAsync(async (req, res) => {
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














