require("dotenv").config();
const mongoose = require("mongoose");

const DB = process.env.mongodb_url;

mongoose.connect(DB).then(()=>console.log("database connected")).catch((err)=>console.log("errr",err))
