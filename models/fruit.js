const mongoose = require('mongoose');
const { Schema } = mongoose;

const fruitSchema = new Schema({
  title: String,
  body: String,
  link: String,
  links: [String],
  weight: Number,
});

const Fruit = mongoose.model('Fruit', fruitSchema);

module.exports = Fruit;

