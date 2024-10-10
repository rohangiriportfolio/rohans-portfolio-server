require("dotenv").config();
require("./db/conn");
const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const userdb = require("./model/userSchema");
const commentdb = require("./model/commentSchema");
const clientid = process.env.client_id;
const clientsecret = process.env.client_secret;
const sessionid = process.env.session_secret;



app.use(cors({
    origin: "https://rohans-portfolio-client.vercel.app",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Custom-Header"]
  }));
  
app.use(express.json());

// setup session
app.use(session({
    secret: sessionid,
    resave:false,
    saveUninitialized:true
}))

// setuppassport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new OAuth2Strategy({
        clientID:clientid,
        clientSecret:clientsecret,
        callbackURL:"https://rohans-portfolio-server.vercel.app/auth/google/callback",
        scope:["profile","email"]
    },
    async(accessToken,refreshToken,profile,done)=>{
        try {
            let user = await userdb.findOne({googleId:profile.id});
            if(!user){
                user = new userdb({
                    googleId:profile.id,
                    displayName:profile.displayName,
                    email:profile.emails[0].value,
                    image:profile.photos[0].value
                });

                await user.save();
            }

            return done(null,user)
        } catch (error) {
            return done(error,null)
        }
    }
    )
)

passport.serializeUser((user,done)=>{
    done(null,user);
})

passport.deserializeUser((user,done)=>{
    done(null,user);
});

// initial google ouath login
app.get("/auth/google", passport.authenticate("google",{scope:["profile","email"]}));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: 'https://rohans-portfolio-client.vercel.app/LogInOut' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('https://rohans-portfolio-client.vercel.app');
  });

app.get("/login/sucess",async(req,res)=>{

    if(req.user){
        try{
            res.status(200).json({message:"user Login",user:req.user})
        }
        catch(error){
            console.log(req.user);
        }
    }else{
        try{
            console.log(req.user);
            res.status(400).json({message:"Not Authorized"})
        }
        catch(error){
            console.log(req.user);
        }
    }
})

app.get("/comments/show", async (req, res) => {
  try {
    const allComments = await commentdb.find({});
    res.send({ message: "Comments sent", comments: allComments });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error fetching comments" });
  }
});



app.post('/comments/submit', (req, res) => {
    const { text, userdata } = req.body;
  
    // Process the text data
    console.log(text, userdata);
    let comment = new commentdb({
        googleId: userdata.googleId,
        displayName: userdata.displayName,
        image: userdata.image,
        comment: text,
        like: [],
        disLike: []
    });
    comment.save();
    // Send a response back to the client
    res.json({ message: 'Data received successfully' });
});  

app.post('/likes/submit', async (req, res) => {
    const { cardId, userdata } = req.body;
    const id = await commentdb.findById(cardId);
    if (id.like.includes(userdata._id)) {
        id.like = id.like.filter(id => id !== userdata._id);
        await id.save();
        res.send({ message: 'false' });
    }
    else {
        id.like.push(userdata._id);
        await id.save();
        res.send({ message: 'true' });
    }
});

app.post('/disLikes/submit', async (req, res) => {
    const { cardId, userdata } = req.body;
    const id = await commentdb.findById(cardId);
    if (id.disLike.includes(userdata._id)) {
        id.disLike = id.disLike.filter(id => id !== userdata._id);
        await id.save();
        res.send({ message: 'false' });
    }
    else {
        id.disLike.push(userdata._id);
        await id.save();
        res.send({ message: 'true' });
    }
});

app.get("/logout",(req,res,next)=>{
    req.logout(function(err){
        if(err){return next(err)}
        res.redirect("https://rohans-portfolio-client.vercel.app");
    })
})

app.listen(process.env.PORT,()=>{
    console.log(`server start at port no ${process.env.PORT}`)
})
