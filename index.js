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

// get user by spotify id
server.get("/users/:spotify_id", (req, res) => {
  const { spotify_id } = req.params;
  db("users")
    .where({ spotify_id })
    .then(users => res.status(200).json(users));
});

//-----------------CRUD for posts------------------------

// post post
server.post("/posts", (req, res) => {
  const post = req.body;
  db("posts")
    .insert({
      spotify_id: post.spotify_id,
      post: post.content
    })
    .then(ids => {
      res.status(201).json(ids[0]);
    })
    .catch(err => res.status(500).json(err));
});

// get post for specific user
server.get("/users/:spotify_id/posts", (req, res) => {
  console.log(res);
});

let port = process.env.PORT || 8888;
console.log(
  `Listening on port ${port}. Go /login to initiate authentication flow.`
);
server.listen(port);
