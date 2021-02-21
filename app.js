const fs = require('fs');
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const debug = require('debug')('myexpressapp:server');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const hbs = require('express-handlebars');
const Fili = require('fili');

// BCI Stuff
const WebSocket = require('ws');

// Settings
let protocol = 'http';
const url = 'localhost'
var port = normalizePort(process.env.PORT || '80');

//
// App
//

const app = express();
const brains = new Map();
const private_brains = new Map();
const interfaces = new Map();
const games = new Map();
app.set('games', games);

app.set('brains', brains);
app.set('private_brains', private_brains);
app.set('interfaces', interfaces);

//CORS
app.use(require("cors")()) // allow Cross-domain requests

// Set Usage of Libraries
app.use(logger('dev'));
app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Listen to Port for HTTP Requests
app.use(function(req, res, next) {
  const validOrigins = [
    `http://localhost`,
    'http://localhost:63342',
    'https://brainsatplay.azurewebsites.net',
    'http://brainsatplay.azurewebsites.net',
    'https://brainsatplay.com'
  ];

  const origin = req.headers.origin;
  if (validOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Set Routes
const initRoutes = require("./routes/web");
initRoutes(app);

// development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log('error')
  });
}

// production error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log('error')
});

// Static Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));
// app.use(express.static(path.join(__dirname, 'libraries','js','muse-js')));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


let Game = require(path.join(__dirname, 'libraries','js','brainsatplay.js'))

app.set("view engine", "ejs"); 
app.set("views", __dirname + "/views"); 


// Setting the port
app.set('port', port);

//
// Server
//
const http = require('http') 
let server = http.createServer(app);  

// Websocket
let wss;
wss = new WebSocket.Server({ clientTracking: false, noServer: true });

function getCookie(req,name) {
  const value = `; ${req.headers.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

//Authentication
server.on('upgrade', function (request, socket, head) {
    let userId;
    let type;
    let access;
    let game;

    if (getCookie(request, 'id') != undefined) {
      userId =  getCookie(request, 'id')
      type = getCookie(request, 'connectionType')
      access = getCookie(request, 'access')
      game = getCookie(request, 'game')
    } else{
      let protocols = request.headers['sec-websocket-protocol'].split(', ')
      userId =  protocols[0]
      type = protocols[1]
      game = protocols[2]
    }
    
    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    let command;

    if (!app.get('games').has(game)){
      app.get('games').set(game, {interfaces: new Map(), brains: new Map(), privateBrains: new Map(), 
        // game:new Game(game)
      });
      
      // // Initialize Server-Side Game Object to Receive Live Data
      // let serverSideGame = app.get('games').get(game).game
      // serverSideGame.initialize()
      // serverSideGame.initializeLockedBuffers()
      // serverSideGame.info.brains = undefined
      // serverSideGame.info.interfaces = undefined
    }

    if (app.get('games').get(game).interfaces.has(userId) == true && ['interfaces','bidirectional'].includes(type)) {
      command = type
    } else if (['brains','bidirectional'].includes(type) && ((access=="public" && app.get('games').get(game).brains.has(userId) == true) || (access=="private" && app.get('games').get(game).privateBrains.has(userId) == true))){
      command = 'close' 
    } else {
      command = 'init'
    }

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, command, request);
    });
});

wss.on('connection', function (ws, command, request) {

  let userId;
  let type;
  let channelNames
  let access;
  let game;
  let _type;

    // Track Connections on the Server
    if (getCookie(request, 'id') != undefined) {
      userId =  getCookie(request, 'id')
      type = getCookie(request, 'connectionType')
      access = getCookie(request, 'access')
      channelNames = getCookie(request, 'channelNames')
      game = getCookie(request, 'game')
    } else if (request.headers['sec-websocket-protocol'] != undefined) {
      let protocols = request.headers['sec-websocket-protocol'].split(', ')
      userId =  protocols[0]
      type = protocols[1]
      game = protocols[2]
      if (type==='bidirectional'){
        access = protocols[3]
        channelNames = []
        for (let i = 4; i < protocols.length; i++){
        channelNames.push(protocols[i])
        }
        channelNames = channelNames.join(',')
      }
    } else {
      ws.send('No userID Cookie (Python) or Protocol (JavaScript) specified')
    }

  // Get the Appropriate Server-Side Game
  // let serverSideGame = app.get('games').get(game).game

  let mirror_id;
  if (command === 'close'){
      ws.send(userId + ' is already has a brain on the network')
    return
  }
  else if (['interfaces','bidirectional'].includes(command)){
    mirror_id = app.get('games').get(game).interfaces.get(userId).connections.length
    app.get('games').get(game).interfaces.get(userId).connections.push(ws);
  }
  else if (command === 'init'){ 
    mirror_id = 0;
    if (access === 'public' || ['interfaces','bidirectional'].includes(type)){
      if (type == 'bidirectional'){
        _type = ['interfaces','brains']
      } else {
        _type = [type];
      }
      _type.forEach((thisType) => {
        app.get('games').get(game)[thisType].set(userId, {connections: [ws], channelNames: channelNames, access: access});
      })
    } else {
      app.get('games').get(game).privateBrains.set(userId, {connections: [ws], channelNames: channelNames, access: access});
    }
  }

  if (access === 'private') {
    ws.send(JSON.stringify({
      msg: "streaming data privately to " + userId + "'s interfaces for "  + game,
      destination: 'init'
    }))
  } else {
    ws.send(JSON.stringify({
      msg: "streaming " + userId + "'s data to " + game,
      destination: 'init'
    }))
  }

  let str = JSON.stringify({
    n: +1,
    id: userId,
    access: access,
    channelNames: channelNames,
    destination: type
  });

    app.get('games').get(game).interfaces.forEach(function each(clients, id) {
      clients.connections.forEach(function allClients(client){
        if (client.readyState === WebSocket.OPEN) {
        // Broadcast new number of brains to all interfaces except yourself
        if (access === 'public' || (['interfaces','bidirectional'].includes(type) && access === undefined)){
          if (client.id != userId){
              client.send(str);
          }
        // Broadcast private brains to authenticated interfaces only
        } else {
          if (id == userId){
            client.send(str);
          }
        }
    }
      })
    });

    // Log new brains on the server-side Game object(if public)

    // if (access === 'public' && _type.includes('brains')){
    //   serverSideGame.add(userId, channelNames, 'public')
    //   serverSideGame.updateUsedChannels()
    //   serverSideGame.getMyIndex()
    //   serverSideGame.initializeLockedBuffers()
    // } 

    // if (access === 'public' && _type.includes('interfaces')){
    //   serverSideGame.info.interfaces += 1;
    // }

    // Manage specific messages from clients
    ws.on('message', function (str) {
      let obj = JSON.parse(str);
      if (obj.destination == 'initializeBrains'){
        // If added user is public or an interface, broadcast their presence
        let brains = app.get('games').get(game).brains
        let channelNamesArray = []
        let privateBrains = app.get('games').get(game).privateBrains.has(userId)
        let privateInfo = {};

        if (obj.public === false){
          if (privateBrains){
            privateInfo['id'] = userId 
            privateInfo['channelNames'] = app.get('games').get(game).privateBrains.get(userId).channelNames
          }
        }

        let keys = Object.keys(Object.fromEntries(brains))

        keys.forEach((key) => {
          channelNamesArray.push(brains.get(key).channelNames)
        })

        let initStr = JSON.stringify({
            msg: 'streaming data to ' +  game,
            nBrains: brains.size,
            privateBrains: privateBrains,
            privateInfo: privateInfo,
            nInterfaces: app.get('games').get(game).interfaces.size,
            ids: keys,
            channelNames: channelNamesArray,
            destination: 'init'
        });

        ws.send(initStr)
      }
      
      if (obj.destination == 'bci'){
        
        // Broadcast brain signals to all interfaces if public
        // (or broadcast only to yourself)
        app.get('games').get(game).interfaces.forEach(function each(clients, id) {
          clients.connections.forEach(function allClients(client){
            if (client.readyState === WebSocket.OPEN) {
              if (access === 'public'){
                  client.send(str);
              } else {
                if (id == userId){
                    client.send(str);
                }
              }
            }
          })
        });

        // Broadcast brain signals to the server-side Game object (if public)
        // if (access === 'public'){
        //   serverSideGame.brains[serverSideGame.info.access].get(obj.id).streamIntoBuffer(obj.data)
        // }
      };

      // Update server-side data after every message
      // app.get('games').get(game).game.update();
    });

    ws.on('close', function () {

      if (access === 'public' || ['interfaces','bidirectional'].includes(type)){
        if (type == 'bidirectional'){
          _type = ['interfaces','brains']
        } else {
          _type = [type];
        }
        _type.forEach((thisType) => {
          if (app.get('games').get(game)[thisType].get(userId).connections.length == 1){
            app.get('games').get(game)[thisType].delete(userId);
          } else {
            app.get('games').get(game)[thisType].get(userId).connections.splice(mirror_id,1)
          }
        })
      } else {
        app.get('games').get(game).privateBrains.delete(userId);
      }
    
      // Broadcast brains update to all interfaces

        let str = JSON.stringify({
          n: -1,
          id: userId,
          access: access,
          destination: type
        });

        app.get('games').get(game).interfaces.forEach(function each(clients, id) {
          clients.connections.forEach(function allClients(client){
            if (client.readyState === WebSocket.OPEN) {
              if (access === 'public' || access === undefined){
                  client.send(str);
              } else {
                if (id == userId){
                    client.send(str);
                }
              }
            }
          })
        });

        // if (access === 'public' && _type.includes('brains')){
        //   serverSideGame.remove(userId, 'public')
        //   serverSideGame.updateUsedChannels()
        //   serverSideGame.getMyIndex()
        //   serverSideGame.initializeLockedBuffers()
        // } 

        // if (access === 'public' && _type.includes('interfaces')){
        //   serverSideGame.info.interfaces += -1;
        // }

        // Remove game from server if empty
        if (app.get('games').get(game).interfaces.size == 0 && app.get('games').get(game).brains.size == 0 && app.get('games').get(game).privateBrains.size == 0){
          app.get('games').delete(game)
        }
    });
});

// error handlers

server.listen(parseInt(port), () => {
  console.log('listening on *:' + port);
});

server.on('error', onError);
server.on('listening', onListening);

console.log(`Server is running on ${protocol}://${url}:${port}`)


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
