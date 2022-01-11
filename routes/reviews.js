const express = require('express');
const router = express.Router({mergeParams:true});
const flash = require('connect-flash');
const { isLoggedIn, validateCampground, isReviewAuthor ,validateReview } = require('../middleware');
const catchAsync=require('../utils/catchAsync');
const reviews = require('../controllers/reviews');
const Review = require('../models/reviews');
const Campground = require('../models/campground');


//add review
router.post('/', isLoggedIn,validateReview, catchAsync(reviews.createReview));

//delete review
router.delete('/:reviewId', isLoggedIn, isReviewAuthor ,catchAsync(reviews.deleteReview));


module.exports = router;