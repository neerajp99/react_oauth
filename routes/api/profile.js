const mongoose = require("mongoose");
const router = require("express").Router();

const authenticationCheck = (req, res, next) => {
  // console.log(req.session)
  if (Object.keys(req.session).length === 1) {
    res.redirect("/check");
  } else {
    next();
  }
};

router.get("/", authenticationCheck, (req, res) => {
  res.json(req.session.passport.user);
});

module.exports = router;
