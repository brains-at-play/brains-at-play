  let connectToggle;
  let disconnectToggle;
  let museToggle;
  let beginGameToggle;
  let input;
  let greeting;
  let message;
  let title;
  var bandpowers = [];
  var bufferArrays;
  var colors;
  let state = 0;
  let setReady = false;
  let opponent;
  let lastOppHealth;
  let pendingState;

  let margin = 100;
  let hasUserId = false;
  let easing = 0.1;
  let displayTime = 2;
  let startTime;
  let toDisconnect = false;
  var bandNames = ['delta', 'theta', 'alpha', 'beta', 'gamma']

  let barHeight = 50;
  let root = 52.125;
  let nVel = 0.8;
  let volMain = 0.8;
  let snd = new music(root, volMain);
  let effects = new sfx(root,nVel);
  let dTime = 200;
  let lastAlertTime = 0;
  let firstAlert = 0;
  let healthDrop = -3;

  setup = () => {

      // P5 Setup
      createCanvas(windowWidth, windowHeight);
      textAlign(CENTER, CENTER);
      connectToggle = createButton('Join a Game');
      beginGameToggle = createButton('Begin Game');
      museToggle = createButton('Connect Muse');
      disconnectToggle = createButton('Leave Game');
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-50-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-50-disconnectToggle.height);
      museToggle.position(windowWidth/2-(museToggle.width/2), windowHeight/2-(museToggle.height/2));
      beginGameToggle.position((windowWidth/2)-beginGameToggle.width/2, (3*windowHeight/4)-beginGameToggle.height);
      disconnectToggle.hide()
      connectToggle.hide()
      beginGameToggle.hide()

      // Name
      input = createInput();
      input.position(windowWidth-input.width-50, windowHeight-50-2.5*disconnectToggle.height);
      input.hide()

      greeting = createElement('p', 'What is your name?');
      greeting.position(windowWidth-input.width-50, windowHeight-50-2.5*disconnectToggle.height-40);
      greeting.hide()

      message = createElement('div')
      message.style('text-align','center')
      message.style('display','flex')
      message.style('justify-content','center')
      message.style('align-items','center')
      message.style('width','100vw')
      message.style('height','100vh')
      message.style('background','black')
      message.style('z-index','50')
      message.style('opacity','0.8')
      message.style('transition','0.5s ease-in-out')
      message.style('pointer-events','none')
      message.center();
      message.html('<div><h1>AlphaBattle</h1><p>Brains@Play | 2021 UW CNT Hackathon Team</p></div>')
      startTime = Date.now() + 1000

      museToggle.mousePressed(async () =>  {
          // BLE
          await game.bluetooth.devices['muse'].connect()
          game.connectBluetoothDevice()
          connectToggle.show()
          input.show()
          greeting.show()
          switchState(1)

          //Audio
          snd.startDrone(volMain);
      });

      connectToggle.mousePressed(() => {
        connect()
      })

      disconnectToggle.mousePressed(() => {
        disconnect()
    })

      // Manage Bands
      bandNames.forEach((bandname) => {
        bandpowers[bandname] = Array.from(Object.keys(game.eegCoordinates), channelName => {
          return Array(500).fill(0)
        })
      })
      colors = [
        // color(25, 113, 118), // Skobeloff
        // color(255, 194, 180), // Melon
        // color(251, 143, 103), // Coral
        // color(248, 225, 108), // Naples Yellow
        // color(172, 32, 53) // Crimson UA
        color('red'), // Skobeloff
        color('orange'), // Melon
        color('yellow'), // Coral
        color('green'), // Naples Yellow
        color('cyan') // Crimson UA
      ]

      // UNCOMMENT TO SKIP MUSE CONNECTION
      // museToggle.hide()
      // connectToggle.show()
    }
    
    draw = () => {

      background(0)

      if (game.bluetooth.connected && ['flex','block'].includes(museToggle.style('display'))){
          museToggle.hide()
      }
    
      // Update Voltage Buffers and Derived Variables
      game.update();

      // Pick Visualization
      if (state === 0){
        bandInspector()
      } else if (state === 1) {
        voltageInspector()
      } else {
        playGame()
      }

      // Update Message
      if (toDisconnect){
        disconnect()
        toDisconnect = false;
        message.center()
        message.style('opacity','1')
        startTime = Date.now()
      } else if (startTime !== undefined){
         if (Date.now() - startTime > displayTime*1000){
            startTime = undefined;
            if (pendingState!== undefined){
              state = pendingState
              pendingState == undefined
            }
            message.style('opacity','0')
            message.html('')
          }
      }




    }
    
  windowResized = () => {
    resizeCanvas(windowWidth,windowHeight)
    connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-50-connectToggle.height);
    disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-50-disconnectToggle.height);
    museToggle.center();
    beginGameToggle.position((windowWidth/2)-beginGameToggle.width/2, (3*windowHeight/4)-beginGameToggle.height);
    input.position(windowWidth-input.width-50, windowHeight-50-2.5*disconnectToggle.height);
    greeting.position(windowWidth-input.width-50, windowHeight-50-2.5*disconnectToggle.height-40);
    message.center();
  }

    mouseClicked = () => {
    }

    keyPressed = () => {
      let keys = [49,50,51]
      if (keys.includes(keyCode)){
        switchState(keys.indexOf(keyCode))
      }

      if (keyCode == ENTER){
        connect()
      }
    }

    function getOpponent(game,me) {
      let opp;
      let usernames = game.getUsernames()
      let equalTo = [me.username,undefined]
      if (usernames.length > 1){
        loop1:
        for (condition of equalTo){
        loop2:
        for (let username of usernames) {
          if (username !== me.username){
            let data = game.brains[game.info.access].get(username).data
            if (data.opponent === condition && data.ready){
              opp = username
              break loop1
            }
        }
        }
      }
      }
      return opp
    }

    function initializeData() {
      return {
        ready: false,
        opponent: undefined,
        attack: undefined,
        health: undefined,
      }
    }

    function disconnect(){
      game.disconnect()
      disconnectToggle.hide()
      if (game.bluetooth.connected){
        connectToggle.show()
        input.show()
        greeting.show()
        beginGameToggle.hide()
        game.brains[game.info.access].get(game.me.username).data = {};
        switchState(1)
      } else {
        switchState(0)
        museToggle.show()
      }
    }

    async function connect(){
        let dict;
        if (input.value() !== ''){
          dict = {'guestaccess': true, 'guestId': input.value()}
          hasUserId = true;
        } else { 
          dict = {'guestaccess': true}
        }          
        game.connect(dict).then(res => {
          switchState(2)
          disconnectToggle.show()
          connectToggle.hide()
          input.hide()
          greeting.hide()
          museToggle.hide()
          beginGameToggle.hide()
          setReady = true;
      })
    }


    function playGame(){
            // Get Opponent (if exists)
            me = game.brains[game.info.access].get(game.me.username)

            if(me !== undefined){
              if (setReady){
                me.data = {};
                me.data.ready = true;
                setReady = false;
              }
              opponent = game.brains[game.info.access].get(me.data.opponent)
            }
      
            // Try to Assign Opponents (if connected to server)
            if (!toDisconnect && startTime === undefined) {
            if (game.connection.status){
            if (me !== undefined){
              if (me.data.ready){      
            // Assign Opponent If Ready For One
            console.log(me.data.opponent)
            if (me.data.opponent === undefined ){
                let opp = getOpponent(game,me)
                if (opp !== undefined){
                  me.setData({health: 100, opponent: opp})
                }
            } 
      
            // Reset If Opponent Leaves
            else {      
            if (opponent === undefined && lastOppHealth !== 0){
              toDisconnect = true;
              message.html(`<div><h3>Opponent Left Server</h1>
            <p>Get back in there!</p></div>`)
            lastOppHealth = undefined;
              // me.data = initializeData()
              // beginGameToggle.show()
            }  
            // Reset if Opponent Dies
            else if (lastOppHealth === 0){
              toDisconnect = true;
              message.html(`<div><h3>You Won</h1>
            <p>Great job!</p></div>`)
            lastOppHealth = undefined;
              // opponent.data = initializeData()
              // me.data = initializeData()
              // beginGameToggle.show()
            } 
            // Reset if You Died
            else if (me.data.health === 0){
              toDisconnect = true;
              message.html(`<div><h3>You Flatlined...</h1>
            <p>Better luck next time!</p></div>`)
              // opponent.data = initializeData()
              // me.data = initializeData()
              // beginGameToggle.show()
            }
            // Keep On Battling!
            else if (me.data.health !== undefined) {
              let val;
              let attack;
              let defense;
            if (game.bluetooth.status){
              attack = me.getMetric('beta')
              defense = me.getMetric('alpha')
              val = attack.average
            } else {
              attack = noise(Date.now()/1000)*10
              defense =  noise(Date.now()/1000 + 1000)*10
              val = attack
            }
            me.data.attack = val
            let diff = defense - opponent.data.attack
            if (!isNaN(diff)){
              
              if (me.data.health + diff >= 0 && me.data.health + diff <= 100){
                // Only let health go down
                if (diff < 0){
                  me.data.health += diff
                }
              } else if (me.data.health + diff < 0){
                me.data.health = 0;
              } else {
                me.data.health = 100;  
              }

              lastOppHealth = opponent.data.health
      
            //giving an alert sound if health drops at a threshold rate or higher:
            if(diff < healthDrop){
              console.log('alert')
              if(!firstAlert){
              lastAlertTime = Date.now();
              firstAlert = 1;  
              }  
              if(abs(Date.now() - lastAlertTime - dTime) < 10){
              effects.playAlert(nVel);
              lastAlertTime = Date.now();
              }  
            }  
            snd.updateDetune(me.data.health, 100);
            }
          }
          }        
        }
        }
      }
    }
            
      
          let centerY = windowHeight/2;      
          // Create Me and Opponent Markers
          [me,opponent].forEach( async (user,ind) => {
            let centerX = (windowWidth/2) + (margin)*((2*ind-1))
            let barScale = ((windowWidth/2) - 2*margin)/100
      
            if (user !== undefined){
      
            // Active Indicator
            // if (user.data.health === undefined){
            //   fill(255,50,0)
            // } else if (user.data.health >= 0 || !user.data.ready){
            //   fill(0,255,50)
            // } else {
            //   fill(255,50,0)
            //   termFlag = true;
            // }
            // User Text
            fill('white')
            textSize(15)
            textAlign(CENTER);
            let currentColor;
            let health;
            if (user.data.health !== undefined){
              health = user.data.health
              if (user.easedHealth === undefined){
                user.easedHealth = health
              }
              user.easedHealth += (health - user.easedHealth)*easing
              let colorScaling = ((100-user.easedHealth)/100)
              currentColor = color(100 + 155*(colorScaling),100+ 155*(1-colorScaling),100+ 155*(1-colorScaling))
              currentColor.setAlpha(155)
              noStroke()
              fill(currentColor)
              rect(centerX,centerY - barHeight,(2*ind-1)*user.easedHealth*barScale,barHeight)
            }
          }
          noFill()
          stroke('white')
          rect(centerX,centerY - barHeight,(2*ind-1)*100*barScale,barHeight)
          })
      
          if (me !== undefined || opponent !== undefined){
            fill('white')
            textStyle(NORMAL)
            textAlign(CENTER,CENTER);
            textSize(20)
            text('vs', windowWidth/2, centerY - barHeight/2)
            if (me !== undefined){
              textAlign(RIGHT);
              textSize(15)
              if (hasUserId){
                text(me.username, (windowWidth/2) + (margin)*(-1), windowHeight/2  + (margin/4))
              } else {
                text('me', (windowWidth/2) + (margin)*(-1), windowHeight/2  + (margin/4))
              }
            }
            if (opponent !== undefined && opponent.data && opponent.data.ready){
              textAlign(LEFT);
              textSize(15)
              if (opponent.username.match(/\w\w\w\w\w\w\w\w-\w\w\w\w-\w\w\w\w-\w\w\w\w-\w\w\w\w\w\w\w\w\w\w\w\w/)){
              text('guest', (windowWidth/2) + (margin)*(+1), windowHeight/2  + (margin/4))
              } else {
                text(opponent.username, (windowWidth/2) + (margin)*(+1), windowHeight/2  + (margin/4))
              }
            }
          }
    }


    function voltageInspector() {

      // textAlign(CENTER)
      // textSize(25)
      // text('Inspect Voltage Data',windowWidth/2, windowHeight/2)
      noStroke()
      fill(50,50,50)
      let headWidth = Math.min(windowHeight/2, windowWidth/2)
      ellipse(windowWidth / 2, windowHeight / 2 + 20, headWidth,headWidth+headWidth*(1/6)) // Head
      ellipse(windowWidth / 2, windowHeight / 2 - (headWidth+headWidth*(1/6) - 50)/2, headWidth/10) // Nose
      ellipse(windowWidth / 2 + 75, windowHeight / 2 + 20, headWidth/10,headWidth/5) // Left Ear
      ellipse(windowWidth / 2 - 75, windowHeight / 2 + 20, headWidth/10,headWidth/5) // Right Ear
    
        // Get Voltage Amplitude
        let me = game.brains[game.info.access].get(game.me.username)
         if (me !== undefined){
        let contactQuality = me.contactQuality();
        let voltageNorm = me.getVoltage(true);
        me.usedChannels.forEach((channelDict,ind) => {
            let [x, y, z] = me.eegCoordinates[channelDict.name]
            
            let centerX = x*(headWidth/150) + (windowWidth / 2)
            let centerY = -y*(headWidth/150) + windowHeight / 2
                   
            let buffer = voltageNorm[channelDict.index]
            let voltageScaling = 50
            let signalWidth = 150
    
    // Zero Line
    stroke(255)
    line(centerX - (signalWidth+10)/2, 
      centerY,
      centerX + (signalWidth+10) - (signalWidth+10)/2, 
      centerY
      )   
      
    
      // Colored Line
    stroke(
      255*(1-contactQuality[channelDict.index]), // Red
      255*(contactQuality[channelDict.index]), // Green
        0
      )
    
        for (let sample = 0; sample < buffer.length; sample++){
           line(centerX + (signalWidth*(sample/buffer.length) - signalWidth/2), 
                centerY - voltageScaling*(buffer[sample]-0.5),
                centerX + (signalWidth*((sample+1)/buffer.length) - signalWidth/2), 
                centerY - voltageScaling*(buffer[sample+1]-0.5)
               )   
        }
           })
         }
    }

    function bandInspector() {
      background(0);
      noStroke()
      fill(50, 50, 50)
      let headWidth = Math.min(windowHeight/2, windowWidth/2)
      ellipse(windowWidth / 2, windowHeight / 2 + 20, headWidth, headWidth + headWidth * (1 / 6)) // Head
      ellipse(windowWidth / 2, windowHeight / 2 - (headWidth + headWidth * (1 / 6) - 50) / 2, headWidth / 10) // Nose
      ellipse(windowWidth / 2 + 75, windowHeight / 2 + 20, headWidth / 10, headWidth / 5) // Left Ear
      ellipse(windowWidth / 2 - 75, windowHeight / 2 + 20, headWidth / 10, headWidth / 5) // Right Ear

      // Get Brain Data
      let me = game.brains[game.info.access].get(game.me.username)
      let toCenter = (windowWidth/2) - 125
      if (me !== undefined) {
        Object.keys(bandpowers).forEach((bandName, bandInd) => {
    
          fill(255)
          text(bandName,110+toCenter,50 + 50*bandInd)
          me.getMetric(bandName).then((bandDict) => {
    
            fill(colors[bandInd])
            noStroke()
            text(bandDict.average.toFixed(3),110+50+toCenter,50 + 50*bandInd)
            noFill()
            bandDict.channels.forEach((val, channel) => {
              bandpowers[bandName][channel].shift()
              bandpowers[bandName][channel].push(val)
            })
    
            // let voltage = brain.getVoltage();
            me.usedChannels.forEach((channelDict, ind) => {
              let [x, y, z] = me.eegCoordinates[channelDict.name]
    
              let centerX = x * (headWidth / 150) + (windowWidth / 2)
              let centerY = -y * (headWidth / 150) + (windowHeight / 2)
    
              let buffer = bandpowers[bandName][channelDict.index] // might need to rename buffer
              let aveAmp = buffer.reduce((a, b) => a + Math.abs(b), 0) / buffer.length;
              let voltageScaling = -25
              let signalWidth = 100
              
              // Zero Line
              strokeWeight(1)
              stroke(255)
              line(centerX - (signalWidth + 10) / 2,
                centerY,
                centerX + (signalWidth + 10) - (signalWidth + 10) / 2,
                centerY
              )
    
    
              // Colored Line
              stroke(colors[bandInd])
    
              for (let sample = 0; sample < buffer.length; sample++) {
                line(centerX + (signalWidth * (sample / buffer.length) - signalWidth / 2),
                  centerY + voltageScaling * buffer[sample],
                  centerX + (signalWidth * ((sample + 1) / buffer.length) - signalWidth / 2),
                  centerY + voltageScaling * buffer[sample + 1]
                )
              }
            })
          });
        })
      }
    }

    function switchState(newState){
      pendingState = newState
      message.style('opacity','1')
      startTime = Date.now()-Math.min((displayTime*1000)-500,(displayTime*1000))
    }
