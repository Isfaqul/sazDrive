const passport = require("passport");
const { prisma } = require("../config/prisma");
const { hashPassword } = require("../utils/util");
const { logInValidation, signUpValidation, validationResult } = require("../middlewares/validator");

const loginGet = (req, res, next) => {
  if (!req.user) {
    res.render("pages/login", { title: "Login", errors: [] });
  } else {
    res.redirect("/drive");
  }
};

const loginPost = [
  logInValidation,
  async (req, res, next) => {
    if (!req.user) {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.render("pages/login", { title: "Login", errors: errors.array() });
      }

      next();
    }
  },
  async (req, res, next) => {
    passport.authenticate("local", (error, user, info) => {
      if (error) return next(error);

      if (!user) {
        console.log(info);
        return res.render("pages/login", { title: "Login", errors: [{ msg: info.message }] });
      }

      req.logIn(user, (error) => {
        if (error) return next(error);
        return res.redirect("/drive");
      });
    })(req, res, next);
  },
];

const logoutPost = async (req, res, next) => {
  if (!req.user) {
    return;
  }

  req.logout((err) => {
    res.redirect("/");
  });
};

const signupGet = (req, res, next) => {
  if (!req.user) {
    res.render("pages/signup", { title: "Signup", errors: [] });
  } else {
    res.redirect("/drive");
  }
};

const signupPost = [
  signUpValidation,
  async (req, res, next) => {
    if (!req.user) {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.render("pages/signup", { title: "Signup", errors: errors.array() });
      }

      try {
        const password = await hashPassword(req.body.password);
        await prisma.user.create({
          data: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username,
            password: password,
          },
        });

        res.redirect("/auth/login");
      } catch (error) {
        console.log(error);
        return res.render("pages/signup", {
          title: "Signup",
          errors: [{ msg: "Could not signup user. Please try again..." }],
        });
      }
    }
  },
];

module.exports = {
  signupGet,
  signupPost,
  loginGet,
  loginPost,
  logoutPost,
};
