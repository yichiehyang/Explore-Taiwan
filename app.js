if (process.env.NODE_ENV !=='production'){
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

const User = require('./models/users');
const ExpressError = require('./utils/ExpressError');
//route
const campgroundRoutes = require('./routes/campground');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/user');
const MongoStore = require("connect-mongo");
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
//const dbUrl = process.env.DB_URL;



//mongoose db mongodb://localhost:27017/yelp-camp
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify:false
});

//paste this area from mongoose website
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('mongo connected!');
});

const app = express();

app.engine('ejs',ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'))); // need to have this and the web can recognize the public folder
app.use(mongoSanitize());

const secret = process.env.SECRET || 'thisisasecret' ;
const store = MongoStore.create({
    mongoUrl: dbUrl, 
    touchAfter: 24 * 3600,
    crypto:{
        secret
    }
});

store.on("error", function(e) {
    console.log("SESSION STORE ERROR",e);
})
const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires:Date.now() + 1000*60*60*24*7, //the expire data for one cookie id
        maxAge: 1000*60*60*24*7,
        httpOnly:true // this is default actually for secure 
        //secure: true // it can only be for https web
    }

}
app.use(session(sessionConfig))
app.use(flash());
app.use(helmet());
//{contentSecurityPolicy: false}
const scriptSrcUrls = [
    "http://stackpath.bootstrapcdn.com/",
    "http://api.tiles.mapbox.com/",
    "http://api.mapbox.com/",
    "http://kit.fontawesome.com/",
    "http://cdnjs.cloudflare.com/",
    "http://cdn.jsdelivr.net"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/"
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/"
];
const fontSrcUrl = []
app.use(
    helmet.contentSecurityPolicy({
        directives:{
            defaultSrc:[],
            connectSrc:["'self'",...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'","'self'",...scriptSrcUrls],
            styleSrc:["'self'", "'unsafe-inline'",...styleSrcUrls],
            workerSrc: ["'self'","blob:"],
            objectSrc:[],
            imgSrc:[
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/yyichieh/",
                "https://images.unsplash.com/"
            ],
            fontSrc: ["'self'",...fontSrcUrl],
        },
    })
)

app.use((req,res,next)=>{
    res.locals.success = req.flash('success');
    //it will appear a success msg when we create a new campground
    res.locals.error = req.flash('error');
    //if there is no campground found we can redirect to the all campground page and tell not found 
    next();
})

app.use(passport.initialize());
app.use(passport.session()); //other session need to be before passport.session
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    //console.log(res.locals.currentUser);
    //to see if you are logged in or not
    next();
})

//use routes
app.use('/', userRoutes);
app.use('/campgrounds',campgroundRoutes);
app.use('/campgrounds/:id/reviews',reviewRoutes);


//home
app.get('/', (req, res) => {
    res.render('home');
});


app.all('*',(req,res,next)=>{
    next(new ExpressError('Page Not Found',404))
})

app.use((err,req,res,next)=>{
    const {statusCode=505} = err;
    if(!err.message) err.message = 'Oh No! Something Went Wrong!'
    res.status(statusCode).render('error',{err});
})
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`serving port ${port}`);
})