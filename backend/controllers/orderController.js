const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");

// ====================================Create New Order =========================================================================================
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;
  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});

// ====================================Get Single Order =========================================================================================

exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new ErrorHandler("Order not found with this order ID", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// ====================================Get All orders for a User =========================================================================================
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  if (orders.length < 1) {
    return next(new ErrorHandler("No orders found for your ID", 404));
  }

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// ====================================Get All Orders -- Admin =========================================================================================
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  if (orders.length < 1) {
    return next(new ErrorHandler("No  Orders found", 404));
  }

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});
