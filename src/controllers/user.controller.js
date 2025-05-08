import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";

const registerUserController = asyncHandler(async (req, files, res) => {
  console.log(req.files, "req.file.pathreq.file.pathreq.file.path");
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

  const existedUser = User.findOne({ $or: [{ email }, { username }] });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }
});

console.log(req.files, "req.file obj");

const avatarLocalPath = req.files?.avatar[0]?.path;
if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

const coverImageLocalPath = req.files?.coverImage[0]?.path;

const avatar = await uploadToCloudinary(avatarLocalPath);
const coverImage = await uploadToCloudinary(coverImageLocalPath);

if (!avatar) {
  throw new ApiError(400, "Avatar is required");
}

const user = await User.create({
  fullname,
  avatar: avatar.url,
  coverImage: coverImage.url || "",
  email,
  password,
  username,
});

console.log(user, "user from model");
const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
);

if (!createdUser)
  throw new ApiError(500, "something went wrong while registring user");

res
  .status(200)
  .json(new ApiError(201, "User created successfully", createdUser));

export { registerUserController };
