const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");

//Create Product -- Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  req.body.user = req.user.id;
  // Reviews Array Sanctity check and addition of Average rating
  if (Array.isArray(req.body.reviews) && req.body.reviews.length > 0) {
    if (req.body.reviews.length === req.body.numOfReviews) {
      let ratingSum = 0;
      req.body.reviews.forEach((rev) => (ratingSum += rev.rating));
      req.body.ratings = ratingSum / req.body.reviews.length;
    } else {
      return next(
        new ErrorHandler(
          "Number of Reviews does not match numbers of reviews in Reviews Array",
          404
        )
      );
    }
  }
  // Reviews Array Sanctity check and addition of Average rating

  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

// ====================================Get all Products =========================================================================================
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = 10;

  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);
  const products = await apiFeature.query;
  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// ====================================Update Product -- Admin =========================================================================================
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("PRODUCT NOT FOUND", 404));
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({ success: true, product });
});

// Delete Product -- Admin
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("PRODUCT NOT FOUND", 404));
  }
  await product.deleteOne();
  res
    .status(200)
    .json({ success: true, message: "PRODUCT DELETED SUCCESSFULLY" });
});

//Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const productCount = await Product.countDocuments();
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("PRODUCT NOT FOUND", 404));
  }
  res.status(200).json({ success: true, product, productCount });
});

// ====================================Create New Review or update the review =========================================================================================

exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productID } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productID);
  const isReviewed = product.reviews.find((rev) => {
    rev.user.toString() === req.user._id.toString();
  });

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }
  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });
  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
});

// ====================================Get All Reviews =========================================================================================

exports.getAllReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    res.status(404).json({
      success: true,
      message: `Product does not exist with ID: ${req.params.id}`,
    });
  } else {
    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  }
});

// ====================================Delete Review =========================================================================================

exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }
  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() != req.query.reviewId.toString()
  );

  let avg = 0;
  reviews.forEach((rev) => {
    avg += rev.rating;
  });
  const ratings = avg / reviews.length;
  const numOfReviews = reviews.length;
  await product.findByIdAndUpdate(
    req.params.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
});
