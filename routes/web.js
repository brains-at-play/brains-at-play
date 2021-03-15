const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const path = require("path");

let routes = app => {

router.get("/", (req, res, next) => {
  return res.sendFile(path.join(`${__dirname}/../public/index.html`));
});

router.post("/login", (req,res,next) => {
  res.send(auth.check(req.body))
});

  return app.use("/", router);
};

module.exports = routes;
