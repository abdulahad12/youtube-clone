import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import fs from "fs";

const registerUserController = asyncHandler(async (req, res) => {
  console.log(req.files, "req.file");
  const { username, email, password, fullname } = req.body;

  console.log(username, email, password, fullname);

  // if (fullname === "") {
  //   throw new ApiError(400, "Fullname is required");
  // }

  // if ([username, email, password, fullname].includes("")) {
  //   throw new ApiError(400, "All fields are required");
  // }

  if (
    [username, email, password, fullname].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email.trim())) {
    throw new ApiError(400, "Invalid email");
  }

  const existedUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // if (!coverImageLocalPath) {
  //   throw new ApiError(400, "Cover Image is required");
  // }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverImageLocalPath);
  console.log(coverImage, "coverImage");

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  // res.status(200).json({ message: "Avatar uploaded successfully" });
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username,
  });

  console.log(user, "user from model");
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(500, "something went wrong while registering user");

  res
    .status(200)
    .json(new ApiError(201, "User created successfully", createdUser));
});

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    console.log(user, "user");

    const accessToken = user.generateAccessToken();
    console.log(accessToken, "accessToken");

    // user.refreshToken = user.generateRefreshToken();
    const refreshToken = user.generateRefreshToken();
    console.log(refreshToken, "refreshToken");

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    console.log(user, "user after save refresh token");

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "some thing went wrong while generating access and refresh token"
    );
  }
};
const loginUserController = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "UserName  or Email is required");
  }
  // if([email, name, password].some((field)=> !field || field.trim() === "")){
  //   throw new ApiError(400, "All fields are required");
  // }

  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    // secure: true,
    // sameSite: true,
    maxAge: 60 * 1000,
  };

  // const options1 = {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: true,
  // };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User Logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUserController = asyncHandler(async (req, res) => {
  // const user = await User.findById(req.user.id);
  // user.refreshToken = "";
  // await user.save({ validateBeforeSave: false });

  await User.findByIdAndUpdate(
    req.user.id,
    { refreshToken: "" },
    { new: true }
  );

  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, "User Logged out successfully", {}));
});

const refreshAccessTokenController = asyncHandler(async (req, res) => {
  const inCommingToken = req.cookies?.refreshToken || req.body?.refreshToken;
  console.log(inCommingToken, "inCommingToken");

  if (!inCommingToken) {
    throw new ApiError(401, "Not authenticated / unAuthorized Request");
  }

  const decodedToken = jwt.verify(
    inCommingToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (!decodedToken) {
    throw new ApiError(401, "invalid refresh token");
  }

  const user = await User.findById(decodedToken?.id);
  if (!user) {
    throw new ApiError(401, "invalid refresh token");
  }

  if (inCommingToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh Token is expired or used");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const options = {
    httpOnly: true,
    // secure: true,
    // sameSite: true,
    maxAge: 60 * 1000,
  };

  // const options1 = {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: true,
  // };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "Access Token Refreshed", {
        accessToken,
        refreshToken,
      })
    );
});

const correctPasswordController = asyncHandler(async (req, res) => {
  console.log(req.body, "req.body");

  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "All fields are required");
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  const user = await User.findById(req.user?.id);
  console.log(user, "user from correctPassword cotroller");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully", {}));
});

const getCurrentUserController = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, "User found successfully", req.user));
});

const updateAccountDetailController = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      fullname,
      email,
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.status(200).json(new ApiResponse(200, "User updated successfully", user));
});

const updateUserAvatarController = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(
      400,
      "Error while uploading Avatar file on cloudinary  "
    );
  }

  // fs.unlinkSync(avatarLocalPath);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      avatar: avatar.url,
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, "User Avatar updated successfully", user));
});

const updateUserCoverImageController = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }
  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new ApiError(
      400,
      "Error while uploading Cover Image file on cloudinary"
    );
  }

  // fs.unlinkSync(coverImageLocalPath);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      coverImage: coverImage.url,
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, "User Cover Image updated successfully", user));
});

const getUserChannelProfileController = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscried: {
          $cond: {
            if: { $in: [req.user?.id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        isSubscried: 1,
      },
    },
  ]);

  // console.log(channel, "channel");

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist/found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Channel found successfully", channel[0]));
});

const getWatchHistoryController = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user.id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
                {
                  $addFields: {
                    owner: {
                      $first: "$owner",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  if (!user?.length) {
    throw new ApiError(404, "User does not exist/found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Watch History found successfully",
        user[0].watchHistory
      )
    );
});
export {
  registerUserController,
  loginUserController,
  logoutUserController,
  refreshAccessTokenController,
  correctPasswordController,
  getCurrentUserController,
  updateAccountDetailController,
  updateUserAvatarController,
  updateUserCoverImageController,
  getUserChannelProfileController,
  getWatchHistoryController,
};
