let connectToggle;
let disconnectToggle;
let museToggle;

let margin = 100;
let ballPos;
let ballSize = 50;
let centersX;
let centersY;


setup = () => {
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
  centersX = [windowWidth/4, 3*windowWidth/4]
  centersY = [3*windowHeight/4, 3*windowHeight/4]

  // Brains@Play Setup
  game = new brainsatplay.Game('template')
  game.newGame('blink')
  game.simulate(1)
  ballPos = windowWidth/2

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
    // Update Voltage Buffers
    game.update();
  
    // Get Voltage Amplitude
    noStroke()

    if (game.bluetooth.connected || game.connection.status){

    textSize(25)
    let brain = game.brains[game.info.access].get(game.me.username)
    let [leftBlink, rightBlink] = brain.blink()
    
    // Move Ball
    if (ballPos < windowWidth-ballSize/2 - margin){
      ballPos += rightBlink;
    }
    if (rightBlink){
      text('right',3*windowWidth/4,windowHeight/4)
    }

    if (ballPos > ballSize/2 + margin){
      ballPos -= leftBlink;
    }
    if (leftBlink){
      text('left',windowWidth/4,windowHeight/4);
    }
    
    // Draw Signal Quality
    let voltageNorm = brain.getVoltage([],true);
    let voltage = brain.getVoltage();
    let contactQuality = brain.contactQuality()
    console.log(contactQuality)
    let ind;
    // let voltage = brain.getVoltage([0.1,100]);
    brain.usedChannels.forEach((channelDict) => {
      let flag = false

      if (channelDict.name == 'Af7'){
        flag = true;
        ind = 0; // left
      } else if (channelDict.name == 'Af8'){
        flag = true;
        ind = 1; // right
      }

      if (flag){
        let bufferNorm = voltageNorm[channelDict.index]
        let voltageScaling = 50
        let signalWidth = 200
        
    // Colored Line
    stroke(
      255*(contactQuality[channelDict.index]), // Red
      255*(1-contactQuality[channelDict.index]), // Green
        0
      )

    for (let sample = 0; sample < bufferNorm.length; sample++){
       line(centersX[ind] + (signalWidth*(sample/bufferNorm.length) - signalWidth/2), 
       centersY[ind] + voltageScaling*bufferNorm[sample],
       centersX[ind] + (signalWidth*((sample+1)/bufferNorm.length) - signalWidth/2), 
       centersY[ind] + voltageScaling*bufferNorm[sample+1]
           )   
    }
  }
  })
}

    // Draw Ball
    if (game.bluetooth.connected || game.connection.status){
      fill(255)
      noStroke()
    } else {
      noFill();
      stroke(255)
    }
    
    ellipse(ballPos, windowHeight/2,50)

  }


    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
      // connectToggle.position(windowWidth - 25 - connectToggle.width, windowHeight - 125 - connectToggle.height);
      // disconnectToggle.position(windowWidth - 25 - disconnectToggle.width, windowHeight - 125 - disconnectToggle.height);
      museToggle.position(windowWidth - 25 - museToggle.width, windowHeight - 50 - museToggle.height);
    }