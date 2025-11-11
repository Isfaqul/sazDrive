const { Router } = require("express");

const authRouter = require("./auth");
const driveRouter = require("./drive");

const router = Router();

router.use("/auth", authRouter);
router.use("/drive", driveRouter);

router.get("/", (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
    return;
  }

  res.redirect("/drive");
});

module.exports = router;
