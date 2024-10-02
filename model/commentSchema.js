const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    googleId:String,
    displayName:String,
    image:String,
    comment: String,
    like: [String],
    disLike: [String]
},{timestamps:true});


const commentdb = new mongoose.model("comments",commentSchema);

module.exports = commentdb;