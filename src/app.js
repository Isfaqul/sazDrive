require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { prisma } = require("./config/prisma");

// Import modules
require("./config/passport");
const routes = require("./routes/index");
const passport = require("passport");

const app = express(); // Init app

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 86400000, // One Day
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // 2 minutes
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.session());

app.use("/", routes);

// 404 handler (for any unspecified route)
app.use((req, res, next) => {
  res.status(404);

  // If you have a custom 404 EJS page:
  res.render("pages/404", { title: "Page Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500);
  res.render("pages/error", {
    title: "Server Error",
    message: err.message || "Something went wrong",
  });
});

module.exports = app;
