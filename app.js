const express = require("express");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const cors = require("cors");
const keys = require("./config/keys");
let user = {};

// Initialize express app
const app = express();

// Initialize passport
app.use(passport.initialize());

// Use cors for making cross origin requests
app.use(cors);

// Creating new facebook-passport strategy
passport.use(cors());

// Facebook Strategy configuration
passport.use(
  new FacebookStrategy(
    {
      clientID: keys.FACEBOOK.clientID,
      clientSecret: keys.FACEBOOK.clientSecret,
      callbackURL: "/auth/facebook/callback"
    },
    (accessToken, refreshToken, profile, done) => {
      console.log(JSON.stringify(profile));
      user = { ...profile };
      done(null, profile);
    }
  )
);

// Facebook Strategy Routes

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get("/auth/facebook", passport.authenticate("facebook"));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get(
  "auth/facebook/callback",
  passport.authenticate(
    ("facebook", { failureRedirect: "/login" }),
    (req, res) => {
      res.json("Sucess");
      res.redirect("/profile");
    }
  )
);

// serializeUser to determine the data of the user object to be stored in the session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get("/user", (req, res) => {
  res.json({ user });
  res.send(user);
});

// Listening app
const port = process.env.PORT || 5003;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
