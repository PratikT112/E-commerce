const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// =================================== REGISTER A USER ====================================================================================
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "this is a sample ID",
      url: "ProfilePIC URL",
    },
  });

  sendToken(user, 201, res);
});

// =================================== LOGIN USER =========================================================================================
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //CHecking if user has given email and password both
  if (!email || !password) {
    return next(new ErrorHandler("Please enter Email and Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  sendToken(user, 200, res);
});

// =================================== LOGOUT USER =========================================================================================
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out successfully",
  });
});

// =================================== FORGOT PASSWORD =========================================================================================
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  // Get Reset Password Token
  const resetToken = user.getResetPasswordToken();
  console.log(resetToken);
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;
  console.log(`rurl: ${resetPasswordUrl}`);

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl}. If you have not requested this email then please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    console.log("in the error block", err.message);
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(err.message, 500));
  }
});

// =================================== RESET PASSWORD =========================================================================================

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  //Creating Token Hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler("Reset Password Token is invalid or has expired.", 400)
    );
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Entered passwords do not match", 400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, res);
});

// =================================== GET USER DETAILS =========================================================================================
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old Password incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("New Passwords do not match", 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendToken(user, 200, res);
});

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  // We will add Cloudinary later
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    useValidators: true,
    useFindAndModify: false,
  });

  sendToken(user, 200, res);
});

// ====================================Get Single user Admin =========================================================================================
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with ID: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// ====================================Make Admin -- Admin =========================================================================================
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  if (newUserData.role === "user") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return next(new ErrorHandler(`No admins left.`, 404));
    }
  }

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    useValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

// ====================================Delete User -- Admin=========================================================================================
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User not found with ID: ${req.params.id}`));
  } else {
    await user.deleteOne();
  }

  sendToken(user, 200, res);
});
