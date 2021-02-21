//const { connect } = require("mongodb");

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
  let allTrialData = [];
  let connectTogglePressed = false;

  setup = () => {
    // P5 Setup
    createCanvas(windowWidth, windowHeight);

    // Buttons
    connectToggle = createButton('Start Session');
    museToggle = createButton('Connect Muse');
    disconnectToggle = createButton('End Session');
    connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
    disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
    museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
    disconnectToggle.hide()

    // Set default settings (inputs)
    settings = {
      name: 'blink',
      subset: 1/objects.length,
      trials: 10,
      iti: 2000, // milliseconds
      numSamples: 100, //500,
      eventDuration: 1000, // milliseconds
      objects: objects
    }

    // Inputs
    color('white')
    inputWidth = 50;
    labelWidth = 150;
    labelSize = 'h5';
    inputTrials = createInput(str(settings.trials));                                            
    inputTrials.size(inputWidth);
    labelTrials = createElement(labelSize, 'Trials');
    labelTrials.size(labelWidth);
    inputIti = createInput(str(settings.iti));                                             
    inputIti.size(inputWidth);
    labelIti = createElement(labelSize, 'Iti (msec)');
    labelIti.size(labelWidth);
    inputNumSamples = createInput(str(settings.numSamples));                                       
    inputNumSamples.size(inputWidth);
    labelNumSamples = createElement(labelSize, 'Number of Samples');      
    labelNumSamples.size(labelWidth);
    inputEventDuration = createInput(str(settings.eventDuration));                                   
    inputEventDuration.size(inputWidth);
    labelEventDuration = createElement(labelSize, 'Event Duration (msec)');          
    labelEventDuration.size(labelWidth);
    positionInputs();

    
  
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
          connectTogglePressed = true;
          console.log("connect toggle pressed!");
      });
  
      disconnectToggle.mousePressed(() => {
          game.initializeSession()
          disconnectToggle.hide()
          connectToggle.show()
          console.log("disconnect toggle pressed!");
          recordDataEndLogic();
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
  
    // Set settings based on user's input
    settings = {
      name: 'blink',
      subset: 1/objects.length,
      trials: Number(inputTrials.value()),
      iti: Number(inputIti.value()), // milliseconds
      numSamples: Number(inputNumSamples.value()), // 500
      eventDuration: Number(inputEventDuration.value()), // milliseconds
      objects: objects
    }

    // Update Voltage Buffers and Derived Variables
    game.update();
  
    fill('white')
    textStyle(BOLD)
    textAlign(CENTER)
    textSize(15)
    //console.log(game.session.currentEventState.chosen)
    if (game.session.currentEventState.chosen[0]){
      text(game.session.currentEventState.chosen[0],(windowWidth-rightSidebar - margin)/2, windowHeight/2)
    }

    textSize(15)
    text('Trial: ' + game.session.trial, (windowWidth - rightSidebar) + margin, margin)
  
    text('State: ' + game.session.state, (windowWidth - rightSidebar) + margin, margin+25)
  
    // If trials are done, stop recording data
    if(game.session.state == "done")
      recordDataEndLogic();


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
      if(connectTogglePressed)
        allTrialData.push(trialData.concat(game.session.currentEventState.chosen[0]));
    }
  
    stroke('white')
    line((windowWidth - rightSidebar - inputTrials.width - 50),0,(windowWidth - rightSidebar - inputTrials.width - 50),windowHeight)
  
  }
  
  positionInputs = () => {
    inputTrials.position(windowWidth-50-connectToggle.width-inputTrials.width-25-inputTrials.width, windowHeight-(50+inputTrials.height)*4);
    labelTrials.position(windowWidth-50-connectToggle.width-inputTrials.width-25-inputTrials.width, windowHeight-(50+inputTrials.height)*4 - 25);
    inputIti.position(windowWidth-50-connectToggle.width-inputTrials.width-25-inputIti.width,windowHeight-(50+inputTrials.height)*3);
    labelIti.position(windowWidth-50-connectToggle.width-inputTrials.width-25-inputIti.width,windowHeight-(50+inputTrials.height)*3 - 25);
    inputNumSamples.position(windowWidth-50-connectToggle.width-inputTrials.width-25-inputNumSamples.width, windowHeight-(50+inputTrials.height)*2);
    labelNumSamples.position(windowWidth-50-connectToggle.width-inputTrials.width-25-inputNumSamples.width, windowHeight-(50+inputTrials.height)*2 - 25);
    inputEventDuration.position(windowWidth-50-connectToggle.width-inputTrials.width-25-inputEventDuration.width, windowHeight-50-inputTrials.height);
    labelEventDuration.position(windowWidth-50-connectToggle.width-inputTrials.width-25-inputEventDuration.width, windowHeight-50-inputTrials.height - 25);
  }

  windowResized = () => {  
      resizeCanvas(windowWidth, windowHeight);
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
      positionInputs();
  }

  recordDataEndLogic = () => {
    if(connectTogglePressed) {
      console.log(allTrialData)
      save(allTrialData, "session_"+Date.now());
      console.log("allTrialData length is -> "+allTrialData.length);
    }  
    allTrialData = [];
    connectTogglePressed = false;
  }
