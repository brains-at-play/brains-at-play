const uuid = require('uuid');
var bcrypt = require('bcrypt-nodejs');

const dbName = "brainsatplay";

var SALT_FACTOR = 5;


module.exports.login = async (req, res) => {
    let username = req.body.username
    let password = req.body.password

    await bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
      bcrypt.hash(password, salt, null, function(err, hash) {
        console.log(hash)
      });
    });
    let guestaccess = req.body.guestaccess
    let guestId = req.body.guestId
    let client = req.app.get('mongo_client')
    const db = client.db(dbName);
    let profile;
    let msg;
    if (guestaccess !== true && !['true','True'].includes(guestaccess)){
    if (username != undefined && password != undefined) {
      profile = await db.collection('profiles').findOne({ $or: [ { username: username }, { email: username } ] })      
      if (profile===null){
        msg = 'no profile exists with this username or email. please try again.'
        res.send({ result: 'incomplete', msg: msg });
      } else {
        bcrypt.compare(password, profile.password, function(err, isMatch) {
          if (err) {
            throw err
          } else if (!isMatch) {
            msg = 'incorrect password. please try again.'
            res.send({ result: 'incomplete', msg: msg });
          } else {
            res.send({ result: 'OK', msg: username , profile: profile});
          }
        })
      }
    }  else {
      msg = 'username/password not defined'
      res.send({ result: 'incomplete', msg: msg })
    }
  } else {
      if (guestId != undefined){
        let numDocs = await db.collection('profiles').find({ username: guestId }).count();
        if (numDocs == 0){
          msg = guestId
          res.send({ result: 'OK', msg: guestId });
        } else {
          msg = 'profile exists with this username. please choose a different guest ID.'
          res.send({ result: 'incomplete', msg: 'profile exists with this username. please choose a different guest ID.' });
        }
      } else {
        msg = uuid.v4();
        res.send({ result: 'OK', msg: msg });
      }
  }
}
