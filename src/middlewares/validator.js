const { body, validationResult } = require("express-validator");

const signUpValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name must not be empty.")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be at least 2 characters long"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("First name must not be empty.")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be at least 2 characters long"),
  ,
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username must not be empty.")
    .bail()
    .isLength({ min: 4, max: 50 })
    .withMessage("Username must be at least 4 characters long")
    .bail(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Enter a valid password")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),
  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Please confirm your password")
    .bail()
    .custom((value, { req }) => {
      const password = req.body.password;

      if (password !== value) {
        throw new Error("Passwords do not match.");
      }

      return true;
    }),
];

const logInValidation = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username must not be empty.")
    .bail()
    .isLength({ min: 4, max: 50 })
    .withMessage("Username must be at least 4 characters long")
    .bail(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Enter a valid password")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),
];

const folderNameValidation = [
  body("folderName")
    .trim()
    .notEmpty()
    .withMessage("Name must not be empty.")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be at least 2 characters long"),
];

module.exports = {
  validationResult,
  signUpValidation,
  logInValidation,
  folderNameValidation,
};
