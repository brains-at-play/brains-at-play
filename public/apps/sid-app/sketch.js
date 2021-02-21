

  let connectToggle;
  let disconnectToggle;
  let museToggle;

  let margin = 100;
  let colors = [];

  // Declare variables for training and testing data
  let feetTraining, rightTraining, feetTesting, rightTesting;

  // Set classfier name and load/save toggle (load -> true, save -> false)
  let classifierName = 'lda';
  let loadOrSaveToggle = false;

  // Toggle to use filter for bandpass
  let useFilter = false;

  // Declare variables for classifiers
  let classifier, classifierPath;

  preload = () => {
    // Load training data
    feetTraining = loadTable('data/feet-training.csv', 'csv');
    rightTraining = loadTable('data/righthand-training.csv', 'csv');

    // Load testing data
    feetTesting = loadTable('data/feet-testing.csv', 'csv');
    rightTesting = loadTable('data/righthand-testing.csv', 'csv');

    // Load classifier if loadOrSaveToggle is true
    if(loadOrSaveToggle) {
      switch(classifierName) {
        case 'lda': classifierPath = "classifiers/ldaParams.json"; break;
      }
      classifier = loadJSON(classifierPath);
    }
  }

  setup = () => {
    // LDA classifier example
    trainAndTestClassifier();

    // Garrett's code
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

    convertStrToNum = (array) => {
      return array.map(function(elem) {
        return elem.map(function(elem2) {
            return parseFloat(elem2);
        });
      });
    }

    computeFeatures = (cspParams, eeg) => {
      let epochSize = 64; // About a fourth of a second per feature
      let trialLength = 750; // Each set of 750 samples is from a different trial

      let features = bci.windowApply(eeg, trial => {

          // Bandpass filter the trial if useFilter is true
          if(useFilter) {
            /* Set filter parameters if filter will be used */
            // Bandpass between 7 and 30 Hz
            let sampleRate = 250;
            let lowFreq = 7;
            let highFreq = 30;
            let filterOrder = 128;
            let firCalculator = new Fili.FirCoeffs();
            let coeffs = firCalculator.bandpass({order: filterOrder, Fs: sampleRate, F1: lowFreq, F2: highFreq});
            let filter = new Fili.FirFilter(coeffs);

            // Apply filter
            let channels = bci.transpose(trial);
            channels = channels.map(signal => filter.simulate(signal).slice(filterOrder));
            trial = bci.transpose(channels);
          }
        
          // Apply CSP over each 64 sample window with a 50% overlap between windows
          return bci.windowApply(trial, epoch => {
              // Project the data with CSP and select the 16 most relevant signals
              let cspSignals = bci.cspProject(cspParams, epoch, 16);
              // Use the log of the variance of each signal as a feature vector
              return bci.features.logvar(cspSignals, 'columns');
          }, epochSize, epochSize / 2);
      }, trialLength, trialLength);
  
      // Concat the features from each trial
      return [].concat(...features);
    }

    trainAndTestClassifier = () => {
      /* Convert data array from string to numeric datatype */
      feetTraining = convertStrToNum(feetTraining.getArray());
      rightTraining = convertStrToNum(rightTraining.getArray());
      feetTesting = convertStrToNum(feetTesting.getArray());
      rightTesting = convertStrToNum(rightTesting.getArray());

      /* Logic for training classifier */
      
      // Project data with CSP
      let cspParams = bci.cspLearn(feetTraining, rightTraining);

      // Compute training data features
      let featuresFeetTraining = computeFeatures(cspParams, feetTraining);
      let featuresRightTraining = computeFeatures(cspParams, rightTraining);

      // Train and save the classifier if toggle is on save
      if(!loadOrSaveToggle) {
        switch(classifierName) {
          case 'lda':
            // Train LDA classifier
            classifier = bci.ldaLearn(featuresFeetTraining, featuresRightTraining);

            // Save LDA classifier
            saveJSON(classifier, 'ldaParams.json');
            break;
        }
      }

      // Compute testing data features
      let featuresFeetTesting = computeFeatures(cspParams, feetTesting);
      let featuresRightTesting = computeFeatures(cspParams, rightTesting);

      // Classify testing data
      let classify = (feature) => {
          let prediction;
          switch(classifierName) {
            case 'lda': prediction = bci.ldaProject(classifier, feature); break;
          }
          // Filter out values between -0.5 and 0.5 as unknown classes
          if(prediction < -0.5) return 0;
          if(prediction > 0.5) return 1;
          return -1; 
      }
      let feetPredictions = featuresFeetTesting.map(classify).filter(value => value != -1);
      let rightPredictions = featuresRightTesting.map(classify).filter(value => value != -1);

      // Evaluate the classifer
      let feetActual = new Array(feetPredictions.length).fill(0);
      let rightActual = new Array(rightPredictions.length).fill(1);

      let predictions = feetPredictions.concat(rightPredictions);
      let actual = feetActual.concat(rightActual);

      let confusionMatrix = bci.confusionMatrix(predictions, actual);

      let bac = bci.balancedAccuracy(confusionMatrix);

      console.log('confusion matrix');
      console.log(bci.toTable(confusionMatrix));
      console.log('balanced accuracy');
      console.log(bac);
    }