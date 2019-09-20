const express = require("express");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const cors = require("cors");
const keys = require("./config/keys");

// Bring in body-parser middleware
const bodyParser = require("body-parser");
// Create an empty object for user details
let user = {};
// Bring in mongoose
const mongoose = require("mongoose");
// Bring in Facebook User model
const FacebookUser = require("./models/SocialUser");

// Initialize express app
const app = express();

// Use bodyParser middleware
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

// Connecting to mongo databse on mlab
const db = keys.mongoURI;

mongoose
  .connect(
    db,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(res => {
    console.log("Database connected successfully");
  })
  .catch(err => {
    console.log(err);
  });

// Initialize passport
app.use(passport.initialize());

// Use cors for making cross origin requests
// app.use(cors);

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
// app.get(
//   "/auth/facebook/callback",
//   passport.authenticate(
//     ("facebook", { failureRedirect: "/login" }),
//     (req, res) => {
//       res.json("Sucess");
//       res.redirect("/profile");
//     }
//   )
// );

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook"),
  (req, res) => {
    // res.json("Welcome " + user.displayName);
    FacebookUser.findOne({
      facebookId: user.id
    }).then(user => {
      if (user) {
        res.status(401).json("User already exists");
        done(null, user);
      } else {
        const newFacebookUser = new FacebookUser({
          user: user.displayName,
          facebookId: user.id
        })
          .save()
          .then(user => {
            res.json(user);
            done(null, user);
          })
          .catch(err => {
            res.json(err);
          });
      }
    });
  }
);

// serializeUser to determine the data of the user object to be stored in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Take the id and the user from the ID
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Use route
app.get("/user", (req, res) => {
  res.json({ user });
  res.send("Welcome ", user.displayName);
});

// Listening app
const port = process.env.PORT || 5003;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
