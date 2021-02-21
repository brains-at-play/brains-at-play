
  
  let connectToggle;
  let disconnectToggle;
  let museToggle;

  let margin = 100;
  let colors = []
  let concentration = 0.5;

  setup = () => {

    for (let i = 0; i < 50; i++){
      colors.push(color(Math.random()*255,Math.random()*255,Math.random()*255))
    }

      // P5 Setup
      createCanvas(400, 400);
      textAlign(CENTER, CENTER);
      resizeCanvas(windowWidth, windowHeight);
      connectToggle = createButton('Connect to Server');
      museToggle = createButton('Connect Muse');
      disconnectToggle = createButton('Disconnect');
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
      disconnectToggle.hide()
    
    
      // Brains@Play Setup
      game = new brainsatplay.Game('infiniterun')
      game.simulate(2);
      
      museToggle.mousePressed(async () => {
          await game.bluetooth.devices['muse'].connect()
          game.connectBluetoothDevice(brainsatplay.museClient)
      });

      connectToggle.mousePressed(() => {
          game.connect({'guestaccess': true})
          disconnectToggle.show()
          connectToggle.hide()
      });
    
      disconnectToggle.mousePressed(() => {
          game.disconnect()
          disconnectToggle.hide()
          connectToggle.show()
      })
    }
    
    draw = () => {

      if (game.bluetooth.connected){
          museToggle.hide()
      } else {
          museToggle.show()
      }

      background(0);
    
      // Update Voltage Buffers and Derived Variables
      game.update();

    }

    
    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
    }

    keyPressed = () => {
      console.log(keyCode)

      // e
      if (keyCode === '69') {
        state = 'end';
      } 
      else if (keyCode === RIGHT_ARROW) {
        value = 0;
      }
    }
