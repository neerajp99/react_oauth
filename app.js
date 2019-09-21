const express = require("express");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const cors = require("cors");
const keys = require("./config/keys");
const session = require("express-session");
const profile = require("./routes/api/profile");

// Bring in cookie session
const cookieSession = require("cookie-session");
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

// Use cors for making cross origin requests
// app.use(cors);
// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Creating new facebook-passport strategy
passport.use(cors());

app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  response.header(
    "Access-Control-Allow-Headers",
    "Content-type, Accept, x-access-token, X-Key"
  );
  response.header("Access-Control-Allow-Credentials", true);
  credentials: "same-origin";
  if (request.method == "OPTIONS") {
    response.status(200).end();
  } else {
    next();
  }
});

// Use express session
app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    secret: "keyboards",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: true,
      secure: process.env.NODE_ENV === "production"
    }
  })
);

// Use cookie session
// app.use(
//   cookieSession({
//     maxAge: 24 * 60 * 60 * 1000,
//     keys: [keys.cookieKey]
//   })
// );

// Facebook Strategy configuration
passport.use(
  new FacebookStrategy(
    {
      clientID: keys.FACEBOOK.clientID,
      clientSecret: keys.FACEBOOK.clientSecret,
      callbackURL: "/auth/facebook/callback"
    },
    (accessToken, refreshToken, profile, done) => {
      // console.log(JSON.stringify(profile));
      user = { ...profile };
      FacebookUser.findOne({
        facebookId: user.id
      })
        .then(user => {
          if (user) {
            // res.status(400).json("User already exists")
            console.log("User already exists");
            done(null, user);
          } else {
            const newFacebookUser = new FacebookUser({
              user: user.displayName,
              facebookId: user.id
            })
              .save()
              .then(user => {
                done(null, user);
              })
              .catch(err => {
                console.log(err);
              });
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
  )
);

// Facebook Strategy Routes

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { failureRedirect: "/check" })
);

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
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/user");
  }
);

// serialize user to determine the data of the user object to be stored in the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Take the id and the user from the ID
passport.deserializeUser((id, done) => {
  console.log("iiiiiid");
  FacebookUser.findById(user.id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      console.log(err);
    });
});

// Use route
// app.get("/user", (req, res) => {
//   console.log(req.session.passport.user.user);
//   res.json("hello");
// });

// Extras route
app.get("/check", (req, res) => {
  res.json("bullshit");
});

// Logout users
app.get("/logout", (req, res) => {
  // req.logout();
  req.session.destroy(err => {
    res.send({ message: "Successfully logged out" });
  });
});

// Use routes
app.use("/user", profile);

// Listening app
const port = process.env.PORT || 5003;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
