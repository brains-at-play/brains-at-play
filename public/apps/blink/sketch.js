let connectToggle;
let disconnectToggle;

let margin = 25;
let signalWidth = 25
let ballPos;
let ballSize;
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
  // Brains@Play Setup
  game = new brainsatplay.Game('blink')
  game.simulate(1)
  ballSize = Math.min(windowHeight/4, windowWidth/4)
  baseY = windowHeight/2;
  ballPos = [windowWidth/2, baseY]
}


draw = () => {

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
    }

    // left
      if (ballPos[0] > ballSize/2 + margin){
        ballPos[0] -= leftBlink*movementSize;
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
        centersX = [ballPos[0] - signalWidth - margin - ballSize/2, ballPos[0] + signalWidth + margin + ballSize/2]
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

      line(centersX[ind] - signalWidth/2, 
        centersY[ind] - 1*voltageScaling*brain.blink.threshold,
        centersX[ind] + signalWidth/2, 
        centersY[ind] - 1*voltageScaling*brain.blink.threshold
       )
  }
  })
}

    // Draw Ball
    if (game.bluetooth.connected || game.connection.status){
      fill(255)
      noStroke()
    } else {
      fill(255)
      text('Connect your brain to begin.', windowWidth/2, windowHeight/2)
      noFill();
      stroke(255)
    }
    
    ellipse(ballPos[0], ballPos[1],ballSize)

  }


    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
    }