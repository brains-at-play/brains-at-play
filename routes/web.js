const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require('fs');
const login = require("./login");

let appsDir = {}
fs.readdir(path.join('public','apps'), (err, files) => {
  files = files.filter(file => !file.includes('.'))
  files.forEach(file => {
    let dir = path.join('public', 'apps',file)
    let info = fs.readFileSync(path.join('public', 'apps',file,'info.json'));
    appsDir[file] = JSON.parse(info)
    appsDir[file].path = dir
    });
  });

let routes = app => {

//   router.get('/:name', function(req, res, next) {
//     res.render(path.join(__dirname,'public','apps',req.params.name,'index'));
// });


router.get("/", function(req, res, next) {
  return res.render("index", { apps: appsDir});
});

router.post("/login", login.login);

  return app.use("/", router);
};

module.exports = routes;
