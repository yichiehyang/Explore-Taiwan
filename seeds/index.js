//if we want to check the database we can use this file
//instead of the main file which may affect many things
const mongoose = require('mongoose');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp',{
    useNewUrlParser:true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('mongo connected!');
});

const sample = array => array[Math.floor(Math.random() * array.length)];

//remember!! it will delete all the database and try new ones 
const seedDB = async() =>{
    await Campground.deleteMany({});
    for (let i = 0; i<20;i++){
        const random1000 = Math.floor(Math.random()*1000);
        const camp = new Campground({
            //location: `${cities[random1000].city}, ${cities[random1000].state}`,
            author: '61026c3b7f1d1c180cc06964',
            location:`${cities[i].city}, ${cities[i].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            //image: 'https://source.unsplash.com/collection/483251',
            description:'Camping is an outdoor activity involving overnight stays away from home with or without a shelter, such as a tent or a recreational vehicle. Typically participants leave developed areas to spend time outdoors in more natural ones in pursuit of activities providing them enjoyment.',
            price: Math.floor(Math.random()*20)+10,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images: [
                { 
                    url : "https://res.cloudinary.com/yyichieh/image/upload/v1627893636/YelpCamp/ztc7sazyp9alkd0n9jsw.jpg", 
                    filename : "YelpCamp/ztc7sazyp9alkd0n9jsw" }, 
                { 
                    url : "https://res.cloudinary.com/yyichieh/image/upload/v1627893638/YelpCamp/a8q2chfgbckskixs3dfr.jpg",
                    filename : "YelpCamp/a8q2chfgbckskixs3dfr" 
                } 
                ]
        })
        //image info: https://source.unsplash.com/ 
        await camp.save();
    }
   
}

seedDB().then(()=>{
    mongoose.connection.close();
});
