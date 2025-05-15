import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const authHeader =
      req.header("Authorization") || req.header("authorization");

    const token =
      req.cookies?.accessToken ||
      (authHeader?.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "").trim()
        : undefined);

    if (!token) {
      throw new ApiError(401, "Not authenticated/ unAuthorized Request");
    }

    // console.log(token, "token");s

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedToken) {
      throw new ApiError(401, "Invalid Token");
    }

    const user = await User.findById(decodedToken?.id).select(
      "-password -refreshToken"
    );

    console.log(user, "user in auth");

    if (!user) {
      // discuss  front end in next video
      throw new ApiError(401, "Invalid access Token");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error.message || "invalid access Token");
  }
});

export { verifyJwt };
