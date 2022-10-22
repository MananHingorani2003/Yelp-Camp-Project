const express = require ("express");
const app = express();
const path = require ("path");
const ejsMate = require ("ejs-mate");
const Joi = require ("joi");
const {campgroundSchema, reviewSchema} =  require ("./schemas.js");
const catchAsync = require ("./utils/catchAsync");
const Review = require ("./models/reviews");
const expressError = require ("./utils/expressError");
const methodOverride = require ("method-override");
const mongoose = require ("mongoose");
const Campground = require ("./models/campgrounds");
const { join } = require("path");

mongoose.connect ('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on ("error", console.error.bind (console, "connection error:"));
db.once ("open", () => {
    console.log ("Database connected!!!");
});

app.engine ('ejs', ejsMate);

app.set ('view engine', 'ejs');
app.set ('views', path.join (__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const validateCampground = (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map (el => el.message).join (',');
        throw new expressError (msg, 400);
    } else {
        next();
    } 
}

const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map (el => el.message).join (',');
        throw new expressError (msg, 400);
    } else {
        next();
    }  

}

app.get ('/', (req, res) => {
    res.render ('home');
})

app.get ('/campgrounds', catchAsync( async (req, res) => {
    const campgrounds = await Campground.find ({});
    res.render ('campgrounds/index', {campgrounds});
}))

app.get ('/campgrounds/new', catchAsync( async (req, res) => {
    res.render ('campgrounds/new');
}))

app.get ('/campgrounds/:id', catchAsync( async (req, res) => {
    const campground = await Campground.findById (req.params.id);
    res.render ('campgrounds/show', {campground});
}))

app.post ('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {
    const campground = new Campground (req.body.campground);
    await campground.save();
    res.redirect (`/campgrounds/${campground._id}`);
}))

app.get ('/campgrounds/:id/edit', catchAsync( async (req, res) => {
    const campground = await Campground.findById (req.params.id);
    res.render ('campgrounds/edit', {campground});

}))

app.put ('/campgrounds/:id', validateCampground ,catchAsync( async (req, res) => {
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate (id, {...req.body.campground});
    res.redirect (`/campgrounds/${campground._id}`);

}))

app.delete ('/campgrounds/:id', catchAsync( async (req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndDelete (id).populate('reviews');
    res.redirect (`/campgrounds`);

}))

app.post ('/campgrounds/:id/reviews', validateReview ,async (req, res) => {
    // res.send ("Who made it!")
    const { id } = req.params;
    const campground = await Campground.findById (id);
    const review = new Review(req.body.review);
    campground.reviews.push (review);
    await review.save();
    await campground.save();
    res.redirect (`/campgrounds/${campground._id}`);
})

app.all ('*', (req, res, next) => {
    next (new expressError('Page not found', 404));

})


app.use ((err, req, res, next) => {
    const {message = "Something went wong!!!", statusCode = 500} = err;
    if (!err.message) {
        err.message = "Oh No! SOmething went wrong!!!";
    }
    res.status(statusCode).render ('error', {err});
})



app.listen (3000, () => {
    console.log ("LISTENING ON PORT 3000!!!");
})



