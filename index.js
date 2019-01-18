const express = require("express");
var cors = require("cors");
// knex
const knex = require("knex");
const knexConfig = require("./knexfile");
const db = knex(knexConfig.development);
// instantiate server
const server = express();
server.use(express.json());
server.use(cors());
require("dotenv").config();

var request = require("request");

let redirect_uri = process.env.REDIRECT_URI || "http://localhost:8888/callback";

// this is given from spotify api
server.get("/login", function(req, res) {
  var scopes = "user-read-private user-read-email";
  res.redirect(
    "https://accounts.spotify.com/authorize" +
      "?response_type=code" +
      "&client_id=" +
      process.env.SPOTIFY_CLIENT_ID +
      (scopes ? "&scope=" + encodeURIComponent(scopes) : "") +
      "&redirect_uri=" +
      encodeURIComponent(redirect_uri)
  );
});

//this is from oauth bridge template from github user mpj
server.get("/callback", function(req, res) {
  let code = req.query.code || null;
  let authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri,
      grant_type: "authorization_code"
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64")
    },
    json: true
  };
  request.post(authOptions, function(error, response, body) {
    var access_token = body.access_token;
    let uri = process.env.FRONTEND_URI || "http://localhost:3000";
    res.redirect(uri + "?access_token=" + access_token);
  });
});

//-----------------CRUD for users------------------------

// post user
server.post("/users", (req, res) => {
  const user = req.body;
  db("users")
    .insert(user)
    .then(ids => {
      res.status(201).json(ids[0]);
    })
    .catch(err => {
      if (err.errno === 19) {
        res.status(200).json("User already exists");
      }
    });
});

// get user by display_name
server.get("/users/:display_name", (req, res) => {
  const { display_name } = req.params;
  db("users")
    .where({ display_name })
    .then(users => res.status(200).json(users))
    .catch(err => {
      res.status(500).json(err);
    });
});

//-----------------CRUD for posts------------------------

// post post
server.post("/posts", (req, res) => {
  console.log(req.body);
  const post = req.body;
  db("posts")
    .insert({
      user_spotify_id: post.user_spotify_id,
      user_display_name: post.user_display_name,
      content: post.content,
      created_at: post.created_at
    })
    .then(ids => {
      res.status(201).json(ids[0]);
    })
    .catch(err => console.log(err));
});

// get posts
server.get("/posts", (req, res) => {
  db("posts")
    .then(posts => res.status(200).json(posts))
    .catch(err => {
      res.status(500).json(err);
    });
});

// get post for specific user
server.get("/users/:spotify_id/posts", (req, res) => {
  // console.log(res);
});

// get user feed(user posts and followers posts)
server.get("/posts/:user_display_name", (req, res) => {
  const { user_display_name } = req.params;
  var follow_posts = [];
  var user_posts = [];
  var news_feed = [];
  db("follows")
    .where({ follower: user_display_name })
    .then(followees => {
      for (let i = 0; i < followees.length; i++) {
        console.log(followees[i].followee);
        db("posts")
          .where({ user_display_name: followees[i].followee })
          .then(followee_posts => {
            follow_posts = followee_posts;
          });
      }
      db("posts")
        .where({ user_display_name })
        .then(posts => {
          user_posts = posts;
          news_feed = follow_posts.concat(user_posts);
          console.log(news_feed);
          res.status(200).json(news_feed);
        });
    })
    .catch(err => console.log(err));
});

//-----------------CRUD for follows------------------------

// post followship
// both follower and followee are display names
server.post("/users/:follower/follows/:followee", (req, res) => {
  console.log(req.params);
  const follower = req.params.follower;
  const followee = req.params.followee;
  db("follows")
    .insert({ follower, followee })
    .then(ids => {
      res.status(201).json(ids[0]);
    })
    .catch(err => res.status.json(err));
});

// get all followships
server.get("/follows", (req, res) => {
  db("follows")
    .then(follows => res.status(200).json(follows))
    .catch(err => {
      console.log(err);
    });
});

let port = process.env.PORT || 8888;
console.log(`Listening on port ${port}.`);
server.listen(port);
