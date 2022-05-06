const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const passport = require('passport');
const localstrategy = require('passport-local');
const flash = require('connect-flash');


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


app.get('/', (req, res) => {
    res.render('home');
})



















app.listen(3000, () => {
    console.log('serving on port 3000');
})














