let connectToggle;
let disconnectToggle;
let museToggle;

let margin = 100;
var bandpowers = [];
var bufferArrays;
var colors;

var bandNames = ['delta', 'theta', 'alpha', 'beta', 'gamma']

setup = () => {

  // P5 Setup
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  resizeCanvas(windowWidth, windowHeight);

  // Brains@Play Setup
  game = new brainsatplay.Game('inspector')
  game.simulate(1)
  // game.simulate(1,[[100,100,100,100,100]],[[8,9,10,11,12]])

  // Assign each value in bandpowers dictionary a buffers array 
  bandNames.forEach((bandname) => {
    bandpowers[bandname] = Array.from(Object.keys(game.eegCoordinates), channelName => {
      return Array(500).fill(0)
    })
  })

  // Declare Colors
  colors = [color(25, 113, 118), // Skobeloff
    color(255, 194, 180), // Melon
    color(251, 143, 103), // Coral
    color(248, 225, 108), // Naples Yellow
    color(172, 32, 53) // Crimson UA
  ]
}

draw = () => {

  background(0);
  noStroke()
  fill(50, 50, 50)
  let headWidth = windowWidth / 2
  ellipse(windowWidth / 2, windowHeight / 2 + 20, headWidth, headWidth + headWidth * (1 / 6)) // Head
  ellipse(windowWidth / 2, windowHeight / 2 - (headWidth + headWidth * (1 / 6) - 50) / 2, headWidth / 10) // Nose
  ellipse(windowWidth / 2 + 75, windowHeight / 2 + 20, headWidth / 10, headWidth / 5) // Left Ear
  ellipse(windowWidth / 2 - 75, windowHeight / 2 + 20, headWidth / 10, headWidth / 5) // Right Ear

  // Update Voltage Buffers
  game.update();

  // Get Brain Data
  let brain = game.getBrain(game.me.username)

  if (brain !== undefined) {
    Object.keys(bandpowers).forEach((bandName, bandInd) => {

      fill(colors[bandInd])
      ellipse(50,50 + 50*bandInd,25)
      
      fill(255)
      text(bandName,100,50 + 50*bandInd)
      brain.getMetric(bandName).then((bandDict) => {

        fill(colors[bandInd])
        noStroke()
        text(bandDict.average,100+100,50 + 50*bandInd)

        noFill()
        bandDict.channels.forEach((val, channel) => {
          bandpowers[bandName][channel].shift()
          bandpowers[bandName][channel].push(val)
        })

        brain.usedChannels.forEach((channelDict, ind) => {
          let [x, y, z] = brain.eegCoordinates[channelDict.name]

          let centerX = x * (headWidth / 150) + (windowWidth / 2)
          let centerY = -y * (headWidth / 150) + (windowHeight / 2)

          let buffer = bandpowers[bandName][channelDict.index] // might need to rename buffer
          let aveAmp = buffer.reduce((a, b) => a + Math.abs(b), 0) / buffer.length;
          let voltageScaling = -25
          let signalWidth = 100


          // Colored Line
          stroke(colors[bandInd])

          for (let sample = 0; sample < buffer.length; sample++) {
            line(centerX + (signalWidth * (sample / buffer.length) - signalWidth / 2),
              centerY + voltageScaling * buffer[sample],
              centerX + (signalWidth * ((sample + 1) / buffer.length) - signalWidth / 2),
              centerY + voltageScaling * buffer[sample + 1]
            )
          }

          // Zero Line
          stroke(0,225,255)
          line(centerX - (signalWidth + 10) / 2,
            centerY,
            centerX + (signalWidth + 10) - (signalWidth + 10) / 2,
            centerY
          )
        })
      });
    })
  }
}


windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
}