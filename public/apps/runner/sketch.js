
  let connectToggle;
  let disconnectToggle;
  let museToggle;

  let marg = 100;
  let colors = []
  let concentration = 0.5;
  let key;

  setup = () => {

      // P5 Setup
      var c = createCanvas(windowWidth, windowHeight);
      c.parent('p5Div');
      textAlign(CENTER, CENTER);
      connectToggle = createButton('Connect to Server');
      museToggle = createButton('Connect Muse');
      disconnectToggle = createButton('Disconnect');
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
      disconnectToggle.hide()
    
    
      // Brains@Play Setup
      startAllGames()

      museToggle.mousePressed(async () => {
          await game.bluetooth.devices['muse'].connect()
          game.connectBluetoothDevice(brainsatplay.museClient)
      });

      connectToggle.mousePressed(() => {
          game.connect({'guestaccess': true})
          disconnectToggle.show()
          connectToggle.hide()
          museToggle.hide()
          game.brains[game.info.access].get(game.me.username).setData({active: true})
      });
    
      disconnectToggle.mousePressed(() => {
          game.disconnect()
          disconnectToggle.hide()
          connectToggle.show()
          museToggle.show()
          startAllGames()
      })
    }
    
    draw = () => {

      if (game.bluetooth.connected && ['flex','block'].includes(museToggle.style('display'))){
          museToggle.hide()
      }
    
      // Update Voltage Buffers and Derived Variables
      game.update();


      let userInd=0;
      let width = 200;
      let ellipseRad = width/8
      game.brains[game.info.access].forEach( async (user,username) => {
        let concentration = await user.getMetric('alpha')
        user.setData({concentration:concentration.average})
        user.setData({points:coinsCollected.length})
        fill(0,0,user.data.concentration.toFixed(3))
        ellipse(marg, marg + (2.5*ellipseRad)*userInd, 2*ellipseRad)
        if (user.data.active){
          fill('white')
          textAlign(LEFT);
          text(username, marg + ellipseRad + 10, marg + (2.5*ellipseRad)*userInd)
          textAlign(CENTER);
          text(user.data.points, marg, marg + (2.5*ellipseRad)*userInd)
        }
        userInd++
      })
    }

    
    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
    }

    keyPressed = () => {
      if (keyCode === RETURN) {
        game.brains[game.info.access].get(game.me.username).setData({active: false})
      } 
    }

    startAllGames = () => {
      game.getUsernames().forEach(username => {
        game.brains[game.info.access].get(username).setData({active: true})
      })
    }
