import express from "express";
import {
  registerUserController,
  loginUserController,
  logoutUserController,
  refreshAccessTokenController,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUserController
);

router.route("/login").post(loginUserController);
router.route("/logout").post(verifyJwt, logoutUserController);

router.route("/refreshtoken").post(refreshAccessTokenController);

export default router;
