let connectToggle;
let disconnectToggle;
let museToggle;

let margin = 25;
let signalWidth = 25
let ballPos;
let ballSize = 50;
let movementSize = 5;
let centersX;
let centersY;
let jump = false;
let tJump = 100; // ms
let jumpSize = 50;
let ease;
let t;
let baseY;


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

  // Brains@Play Setup
  game = new brainsatplay.Game('template')
  game.newGame('blink')
  game.simulate(1)
  baseY = windowHeight/2;
  ballPos = [windowWidth/2, baseY]

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
    let contactQuality = brain.contactQuality(brain.blink.threshold,brain.blink.duration)

    // Move Ball
    // right
    if (ballPos[0] < windowWidth-ballSize/2 - margin){
      ballPos[0] += rightBlink*movementSize;
      if (rightBlink) {
        text('right',3*windowWidth/4,windowHeight/4);
      }
    }

    // left
      if (ballPos[0] > ballSize/2 + margin){
        ballPos[0] -= leftBlink*movementSize;
        if (leftBlink) {
          text('left',windowWidth/4,windowHeight/4);
        }
      }

    // up'
    if (leftBlink && rightBlink){
      jump = true;
      t = Date.now()
    } else if (jump === true && (Date.now() - t) > tJump){
      jump = false
    }
    
    ballPos[1] = baseY - jump*jumpSize;

    // Draw Signal Quality
    let voltageNorm = brain.getVoltage();
    let voltageScaling = -0.02

    let ind;
    brain.usedChannels.forEach((channelDict) => {
      let flag = false

      if (channelDict.name === 'Af7'){
        flag = true;
        ind = 0; // left
      } else if (channelDict.name === 'Af8'){
        flag = true;
        ind = 1; // right
      }

      if (flag){
        let bufferNorm = voltageNorm[channelDict.index]
        bufferNorm = bufferNorm.slice(bufferNorm.length-brain.blink.duration)
        centersX = [ballPos[0] - signalWidth - margin, ballPos[0] + signalWidth + margin]
        centersY = [ballPos[1], ballPos[1]]    
        
    // Colored Line
    stroke(
      255*(1-contactQuality[channelDict.index]), // Red
      255*(contactQuality[channelDict.index]), // Green
        0
      )

    for (let sample = 0; sample < bufferNorm.length; sample++){
       line(centersX[ind] + (signalWidth*(sample/bufferNorm.length) - signalWidth/2), 
       centersY[ind] + voltageScaling*bufferNorm[sample],
       centersX[ind] + (signalWidth*((sample+1)/bufferNorm.length) - signalWidth/2), 
       centersY[ind] + voltageScaling*bufferNorm[sample+1]
           )   
    }

    stroke(255)
    line(centersX[ind] - signalWidth/2, 
       centersY[ind] + 1*voltageScaling*brain.blink.threshold,
       centersX[ind] + signalWidth/2, 
       centersY[ind] + 1*voltageScaling*brain.blink.threshold
      )
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
    
    ellipse(ballPos[0], ballPos[1],50)

  }


    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
      // connectToggle.position(windowWidth - 25 - connectToggle.width, windowHeight - 125 - connectToggle.height);
      // disconnectToggle.position(windowWidth - 25 - disconnectToggle.width, windowHeight - 125 - disconnectToggle.height);
      museToggle.position(windowWidth - 25 - museToggle.width, windowHeight - 50 - museToggle.height);
    }