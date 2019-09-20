const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create facebook user schema
const FacebookUserSchema = new Schema({
  user: {
    type: String,
    isRequired: true
  },
  facebookId: {
    type: String,
    isRequired: true
  }
});

module.exports = FacebookUser = mongoose.model(
  "facebookuser",
  FacebookUserSchema
);
