const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { prisma } = require("../config/prisma");
const { comparePassword } = require("../utils/util");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await prisma.user.findFirst({
      where: {
        username: username,
      },
    });

    if (!user) return done(null, null, { message: "Invalid credentials" });
    if (!(await comparePassword(user.password, password))) return done(null, null, { message: "Invalid credentials" });

    return done(null, user);
  })
);

passport.serializeUser((user, done) => {
  return done(null, user.id);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        createdAt: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
