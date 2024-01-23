const mongoose = require('mongoose');
const { Schema } = mongoose;

const wikiSchema = new Schema({
  title: String,
  body: String,
  link: String,
  links: [String],
  weight: Number,
});

const Wiki = mongoose.model('Wiki', wikiSchema);

module.exports = Wiki;

