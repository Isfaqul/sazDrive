const { Router } = require("express");
const controller = require("../controllers/authController");

const authRouter = Router();

authRouter.get("/signup", controller.signupGet);
authRouter.post("/signup", controller.signupPost);

authRouter.get("/login", controller.loginGet);
authRouter.post("/login", controller.loginPost);

authRouter.post("/logout", controller.logoutPost);

module.exports = authRouter;
