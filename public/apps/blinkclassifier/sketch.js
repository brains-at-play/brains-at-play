  let connectToggle;
  let disconnectToggle;
  let museToggle;
  
  let length = 5;
  let numItems = Math.pow(length, 2);
  let objects = ['blink right', 'blink left', 'blink both', "don't blink"];
  let margin = 100;
  let rightSidebar = 300;
  let chooseEllipses = [];
  let scaleEEG = 30;
  
  let settings = {
    name: 'blink',
    subset: 1/objects.length,
    trials: 10,
    iti: 2000, // milliseconds
    numSamples: 100, //500,
    eventDuration: 1000, // milliseconds
    objects: objects
  }
  
  setup = () => {
    // P5 Setup
    createCanvas(windowWidth, windowHeight);
    connectToggle = createButton('Start Session');
    museToggle = createButton('Connect Muse');
    disconnectToggle = createButton('End Session');
    connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
    disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
    museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
    disconnectToggle.hide()
  
    // Brains@Play Setup
    game = new brainsatplay.Game('p300')
    game.simulate(2);
  
    // Button Setup 
    museToggle.mousePressed(async () => {
      await game.bluetooth.devices['muse'].connect()
      game.connectBluetoothDevice(brainsatplay.museClient)
    });
  
      connectToggle.mousePressed(() => {
          game.initializeSession(settings)
          disconnectToggle.show()
          connectToggle.hide()
      });
  
      disconnectToggle.mousePressed(() => {
          game.initializeSession()
          disconnectToggle.hide()
          connectToggle.show()
      })
  }
  
  draw = () => {  
    background(0);
    noStroke()
  
    if (game.bluetooth.connected){
      museToggle.hide()
  } else {
      museToggle.show()
  }
  
    // Update Voltage Buffers and Derived Variables
    game.update();
  
    fill('white')
    textStyle(BOLD)
    textSize(15)
    console.log(game.session.currentEventState.chosen)
    if (game.session.currentEventState.chosen[0]){
      text(game.session.currentEventState.chosen[0],windowWidth/2, windowHeight/2)
    }

    textSize(15)
    text('Trial: ' + game.session.trial, (windowWidth - rightSidebar) + margin, margin)
  
    text('State: ' + game.session.state, (windowWidth - rightSidebar) + margin, margin+25)
  
    for (let trial = 0; trial < game.session.numTrials; trial++){
      noStroke()
      text('Trial ' + trial, 
      (windowWidth - rightSidebar) + margin, 
      margin + 75 + 50*(trial+1))
  
      stroke(54, 235, 255)
      let trialData = game.session.data.voltage[trial][game.usedChannels[0].index]
      trialData.forEach((point ,ind) => {
          line((((windowWidth-rightSidebar+margin)) + ((rightSidebar-2*margin)*ind/trialData.length)),
          margin + 90 + 50*(trial+1) - (trialData[ind]/scaleEEG),
          (((windowWidth-rightSidebar+margin)) + ((rightSidebar-2*margin)*(ind+1)/trialData.length)),
          margin + 90 + 50*(trial+1) - (trialData[ind+1]/scaleEEG),
        )
      })
    }
  
    stroke('white')
    line((windowWidth - rightSidebar),0,(windowWidth - rightSidebar),windowHeight)
  
  }
  
  windowResized = () => {  
      resizeCanvas(windowWidth, windowHeight);
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
  }
