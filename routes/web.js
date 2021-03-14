const express = require("express");
const router = express.Router();
const login = require("./login");
const path = require("path");
const uuid = require('uuid');

let routes = app => {

router.get("/", (req, res, next) => {
  return res.sendFile(path.join(`${__dirname}/../public/index.html`));
});

router.post("/login", login.login);

  return app.use("/", router);
};

module.exports = routes;
