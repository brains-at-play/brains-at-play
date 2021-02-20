
  let connectToggle;
  let disconnectToggle;
  let museToggle;

  let margin = 100;
  let colors = []

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
      game = new brainsatplay.Game('template')
      game.newGame('template')
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

      // Draw Raw Voltage 
      let c;
      let usernames = game.getUsernames()
      let viewedChannels = game.usedChannels
      // console.log(viewedChannels)
      usernames.forEach((username, ind) => {
       c = colors[ind]
       if (ind === game.me.index){
          c = color('#1cc5cd')
          c.setAlpha(200)
       } else {
          c = colors[ind]
          c.setAlpha(150)
       }
        strokeWeight(1)
        stroke(c)
        textSize(100);
    
        let brainData = game.brains[game.info.access].get(username).getVoltage()
        viewedChannels.forEach((usedChannel,ind) => {
            let data = brainData[usedChannel.index]
            let dx = windowWidth / data.length;

      // Voltage Lines
        for (var point = 0; point < data.length - 1; point++) {
          line(point * dx,
            ((data[point] * (windowHeight-2*margin)/ (1000*(viewedChannels.length-1))) + (ind/(viewedChannels.length-1))*(windowHeight-2*margin) + margin),
            (point + 1) * dx,
            ((data[point + 1] * (windowHeight-2*margin) / (1000*(viewedChannels.length-1))) + (ind/(viewedChannels.length-1))*(windowHeight-2*margin) + margin)
          )
        }
      // Electrode Name Text
          fill('white')
          textSize(15)
          text(usedChannel.name, 
                  50, 
                  ((ind/(viewedChannels.length-1))*(windowHeight-2*margin) + margin),
              )
          })
      })
      
      // Draw Synchrony 
      game.getMetric('synchrony').then((synchrony) => {
      noFill()
      if (synchrony.average< 0) {
          stroke('blue')
      } else {
          stroke('red')
      }
      strokeWeight(2)
      ellipse((windowWidth / 2), windowHeight/2, 10 * synchrony.average * Math.min(windowHeight / 2, windowWidth / 2));
    
      noStroke()
      // Include Text for Raw Synchrony Value
      fill('white')
      textStyle(BOLD)
      textSize(15)
      text('Synchrony', windowWidth / 2, windowHeight-100)
      textStyle(ITALIC)
      textSize(10)
    
      if (!game.info.simulated) {
          text('Live Data Stream', windowWidth / 2, windowHeight-80)
      } else {
          text('Synthetic Data Stream', windowWidth / 2, windowHeight-80)
      }
      
      textStyle(NORMAL)
      if ((game.info.brains === 0 || game.info.brains === undefined) && game.connection.status) {
          text('No brains on the network...', windowWidth / 2, windowHeight/2)
      } else if (game.info.brains < 2 && game.connection.status) {
          text('One brain on the network...', windowWidth / 2, windowHeight/2)
      } else {
          if (synchrony.average !== undefined){
              text(synchrony.average.toFixed(4), windowWidth / 2, windowHeight/2)
            } else {
              text(synchrony.average, windowWidth / 2, windowHeight/2)
            }
      }
    })
    }

    
    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
  }
