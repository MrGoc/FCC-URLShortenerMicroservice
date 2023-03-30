require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const app = express();
const bodyParser = require("body-parser");
// Basic Configuration
const port = process.env.PORT || 3000;
const nodeCache = require("node-cache");
const myCache = new nodeCache();

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

// Middleware for parsing body
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use("/api/shorturl", (req, res, next) => {
  if (req.body.url !== undefined) {
    if (req.body.url.includes("http://") || req.body.url.includes("https://")) {
      dns.lookup(req.body.url, function (err, addresses, family) {
        if (err.code === "ENOTFOUND") next();
        else res.json({ error: "invalid url" });
      });
    } else res.json({ error: "invalid url" });
  } else next();
});

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", function (req, res) {
  let mykeys = myCache.keys();
  const key = mykeys.find((el) => el === req.body.url);
  let newUrl = { original_url: req.body.url, short_url: 0 };
  if (key === undefined) {
    newUrl.short_url = mykeys.length + 1;
    myCache.set(req.body.url, newUrl);
  } else {
    let myUrl = myCache.get(req.body.url);
    newUrl.short_url = myUrl.short_url;
  }
  res.json(newUrl);
});

app.get("/api/shorturl/:id", function (req, res) {
  let mykeys = myCache.keys();
  let myKey;
  let url = "";
  for (let i = 0; i < mykeys.length; i++) {
    myKey = myCache.get(mykeys[i]);
    if (myKey.short_url == req.params.id) {
      url = myKey.original_url;
      break;
    }
  }
  if (url === "") res.json({ error: "invalid url" });
  else res.redirect(url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
