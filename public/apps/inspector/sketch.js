let connectToggle;
let disconnectToggle;
let museToggle;

let margin = 100;
let colors = []

setup = () => {

  for (let i = 0; i < 50; i++) {
    colors.push(color(Math.random() * 255, Math.random() * 255, Math.random() * 255))
  }

  // P5 Setup
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  resizeCanvas(windowWidth, windowHeight);
  // connectToggle = createButton('Connect to Server');
  museToggle = createButton('Connect Muse');
  // disconnectToggle = createButton('Disconnect');
  // connectToggle.position(windowWidth - 25 - connectToggle.width, windowHeight - 125 - connectToggle.height);
  // disconnectToggle.position(windowWidth - 25 - disconnectToggle.width, windowHeight - 125 - disconnectToggle.height);
  museToggle.position(windowWidth - 25 - museToggle.width, windowHeight - 50 - museToggle.height);
  // disconnectToggle.hide()


  // Brains@Play Setup
  game = new brainsatplay.Game('template')
  game.newGame('inspector')
  game.simulate(1,[[100]],[[10]])

  museToggle.mousePressed(async () => {
    await game.bluetooth.devices['muse'].connect()
    game.connectBluetoothDevice(brainsatplay.museClient)
  });

  // connectToggle.mousePressed(() => {
  //   game.connect({
  //     'guestaccess': true
  //   })
  //   disconnectToggle.show()
  //   connectToggle.hide()
  // });

  // disconnectToggle.mousePressed(() => {
  //   game.disconnect()
  //   disconnectToggle.hide()
  //   connectToggle.show()
  // })
}

draw = () => {
  
    if (game.bluetooth.connected) {
      museToggle.hide()
    } else {
      museToggle.show()
    }

    background(0);
  noStroke()
  fill(50,50,50)
  let headWidth = Math.min(windowHeight/2, windowWidth/2)
  ellipse(windowWidth / 2, windowHeight / 2 + 20, headWidth,headWidth+headWidth*(1/6)) // Head
  ellipse(windowWidth / 2, windowHeight / 2 - (headWidth+headWidth*(1/6) - 50)/2, headWidth/10) // Nose
  ellipse(windowWidth / 2 + 75, windowHeight / 2 + 20, headWidth/10,headWidth/5) // Left Ear
  ellipse(windowWidth / 2 - 75, windowHeight / 2 + 20, headWidth/10,headWidth/5) // Right Ear

    // Update Voltage Buffers
    game.update();
  
    // Get Voltage Amplitude
    let brain = game.brains[game.info.access].get(game.me.username)
     if (brain !== undefined){
      let voltage = brain.getVoltage();
    // let voltage = brain.getVoltage([0.1,100]);
    brain.usedChannels.forEach((channelDict,ind) => {
        let [x, y, z] = brain.eegCoordinates[channelDict.name]
        
        let centerX = x*(headWidth/150) + (windowWidth / 2)
        let centerY = -y*(headWidth/150) + windowHeight / 2
               
        let buffer = voltage[channelDict.index]
        let aveAmp = buffer.reduce((a, b) => a + Math.abs(b), 0) / buffer.length;
        let voltageScaling = (headWidth/150)/10
        let signalWidth = 50*(1+voltageScaling)

// Zero Line
stroke(255,255,255)
line(centerX - (signalWidth+10)/2, 
  centerY,
  centerX + (signalWidth+10) - (signalWidth+10)/2, 
  centerY
  )   
  

  // Colored Line
stroke(
  255*(aveAmp/100), // Red
  255*(1-aveAmp/100), // Green
    0
  )

    for (let sample = 0; sample < buffer.length; sample++){
       line(centerX + (signalWidth*(sample/buffer.length) - signalWidth/2), 
            centerY + voltageScaling*buffer[sample],
            centerX + (signalWidth*((sample+1)/buffer.length) - signalWidth/2), 
            centerY + voltageScaling*buffer[sample+1]
           )   
    }
    
    // Text Label
    noStroke()
    textSize(10)
    fill('white')
    text(aveAmp.toFixed(1) + ' uV',
      centerX,
      centerY + (40*(1+voltageScaling))
         )       
       })
     }
}


    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
      // connectToggle.position(windowWidth - 25 - connectToggle.width, windowHeight - 125 - connectToggle.height);
      // disconnectToggle.position(windowWidth - 25 - disconnectToggle.width, windowHeight - 125 - disconnectToggle.height);
      museToggle.position(windowWidth - 25 - museToggle.width, windowHeight - 50 - museToggle.height);
    }