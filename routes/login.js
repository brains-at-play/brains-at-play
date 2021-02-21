const uuid = require('uuid');

module.exports.login = async (req, res) => {

    let msg = uuid.v4();
        res.send({ result: 'OK', msg: msg });
}
