
  let connectToggle;
  let disconnectToggle;
  let museToggle;

  let margin = 100;
  let colors = []
  let concentration = 0.5;
  let key;

  setup = () => {

    for (let i = 0; i < 50; i++){
      colors.push(color(Math.random()*255,Math.random()*255,Math.random()*255))
    }

      // P5 Setup
      createCanvas(400, 400);
      textAlign(CENTER, CENTER);
      resizeCanvas(windowWidth, windowHeight);
      startToggle = createButton('Start Game');
      connectToggle = createButton('Connect to Server');
      museToggle = createButton('Connect Muse');
      disconnectToggle = createButton('Disconnect');
      startToggle.position((windowWidth/2)-connectToggle.width/2, (windowHeight/2)-connectToggle.height/2);
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
      disconnectToggle.hide()
    
    
      // Brains@Play Setup
      game = new brainsatplay.Game('infiniterun')
      game.simulate(1);
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
      });
    
      disconnectToggle.mousePressed(() => {
          game.disconnect()
          disconnectToggle.hide()
          connectToggle.show()
          museToggle.show()
          startAllGames()
      })

      startToggle.mousePressed(() => {
        game.brains[game.info.access].get(game.me.username).setData({active: true})
      });
    }
    
    draw = () => {

      if (game.bluetooth.connected && ['flex','block'].includes(museToggle.style('display'))){
          museToggle.hide()
      }

      background(0);
    
      // Update Voltage Buffers and Derived Variables
      game.update();


      let userInd=0;
      let width = 200;
      let height = 150;
      game.brains[game.info.access].forEach( async (user,username) => {
        let concentration = await user.getMetric('alpha')
        user.setData({concentration:concentration.average})
        if (!user.data.active){
          fill('red')
        } else {
          fill('gray')
        }
        rectMode(CORNER);
        rect(margin + width*userInd,0,width,height)
        if (user.data.active){
          fill('white')
          textAlign(LEFT);
          text('Game On: ' + user.data.active,margin + 20+(width*userInd),height*(1/3))
          text('Concentration: ' + user.data.concentration.toFixed(3),margin + 20+(width*userInd),height*(2/3))
        }
        userInd++
      })

      text(game.info.brains,50,windowHeight/2)
      text(game.info.interfaces,50,windowHeight/2 + 50)
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
