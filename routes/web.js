const express = require("express");
const router = express.Router();
const path = require("path");
const uuid = require('uuid');

let routes = app => {

router.get("/", (req, res, next) => {
  return res.sendFile(path.join(`${__dirname}/../public/index.html`));
});

router.post("/login", (req, res) => {
      res.send({ result: 'OK', msg: uuid.v4() });
});

  return app.use("/", router);
};

module.exports = routes;
