import express from "express";
import {
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
router.route("/correctpassword").post(verifyJwt, correctPasswordController);
router.route("/getcurrentuser").get(verifyJwt, getCurrentUserController);
router
  .route("/updateaccountdetail")
  .post(verifyJwt, updateAccountDetailController);
router
  .route("/updateuseravatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatarController);
router
  .route("/updateusercoverimage")
  .put(verifyJwt, upload.single("coverImage"), updateUserCoverImageController);

router
  .route("/channel/:username")
  .get(verifyJwt, getUserChannelProfileController);

router.route("/getwatchhistory").get(verifyJwt, getWatchHistoryController);

export default router;
