  let connectToggle;
  let disconnectToggle;
  
  let length = 5;
  let numItems = Math.pow(length, 2);
  let objects = [];
  for (let i=0;i < numItems; i++){
    objects.push(i.toString())
  }
  let margin = 100;
  let rightSidebar = 300;
  let chooseEllipses = [];
  let scaleEEG = 30;
  
  let settings = {
    name: 'p300',
    subset: 0.2,
    trials: 10,
    iti: 1000, // milliseconds
    numSamples: 100, //500,
    eventDuration: 250, // milliseconds
    objects: objects
  }
  
  setup = () => {
    // P5 Setup
    createCanvas(windowWidth, windowHeight);
    connectToggle = createButton('Start Session');
    disconnectToggle = createButton('End Session');
    connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
    disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
    disconnectToggle.hide()
  
    // Brains@Play Setup
    game = new brainsatplay.Game('p300')
    game.simulate(2);
  
    // Button Setup 
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

    // Update Voltage Buffers and Derived Variables
    game.update();
  
    chooseEllipses = game.session.currentEventState.chosen
    chooseEllipses = chooseEllipses.map((key) => {
      return objects.indexOf(key)
    })
  
    let num = 0;
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < length; j++) {
        if (chooseEllipses.includes(num)) {
          fill(0)
        } else {
          fill(255)
        }
  
        ellipse(margin + (i * ((windowWidth - 2 * margin - rightSidebar) / (length - 1))), // x
          margin + (j * ((windowHeight - 2 * margin) / (length - 1))), // y
          Math.min(windowWidth, windowHeight) * (1 / (3 * length))) // size
        
        num++
      }
    }
  
    fill('white')
    textStyle(BOLD)
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
  }
