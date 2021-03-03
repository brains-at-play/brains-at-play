// Map code adapted from the Earthquake Data Viz video by Daniel Shiffman
// https://youtu.be/ZiYdOwOrGyc

var mapimg;

var ww = 1024;
var hh = 512;
var ratio = 1024 / 512
var zoom = 1;
let points = []
let state = 0;

// Brainwave Drawing 2021
let c;
let trace;
let capture;
let geolocation = {location: {lat:NaN,lng:NaN}};
let mapToggle;
let voltageBuffers =  Array.from({length: 2}, e => [])
let maxBufferSize = 500;

function preload() {
  mapimg = loadImage('https://api.mapbox.com/styles/v1/mapbox/dark-v9/static/' +
    clon + ',' + clat + ',' + zoom + '/' +
    ww + 'x' + hh +
    '?access_token=pk.eyJ1IjoiZ2FycmV0dG1mbHlubiIsImEiOiJja2xyODNrZTYwMXZmMndvOW5mcTBtNXk3In0.zLQAyAG6c65Ui2NMFQenMQ');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
    
  httpGet('https://geo.ipify.org/api/v1?apiKey=at_Yqr1ZTjTqmQ3s8Tnw6h31wmgokfxT', function(response) {
    geolocation = JSON.parse(response);
    points.push(new MapPoint(geolocation.location.lat, geolocation.location.lng,0.01))
  });

  // Brainwave Drawing 2021
  game = new brainsatplay.Game('brainwavedrawings')
  game.simulate(2);
  c = color(255, 255, 255);
  mapToggle = createButton('Back to Map');
  mapToggle.position(windowWidth - 25 - mapToggle.width, windowHeight - 25 - mapToggle.height);
  mapToggle.hide()
  mapToggle.mousePressed(() => {
    state = 0;
    capture = undefined;
    mapToggle.hide()
  });
}

function draw() {
  background('black')
  game.update();

  if (state === 0) {
    translate(windowWidth / 2, windowHeight / 2);
    imageMode(CENTER);
    image(mapimg, 0, 0);

    noStroke()
    points.forEach(point => {
      fill(point.c);
      let [x, y, d] = translateMercatorToScreen(point.x, point.y, point.d)
      ellipse(x, y, d);
    })
  } else if (state == 1) {

    imageMode(CENTER);
    // Get Voltages from Two Users
    let usernames = game.getUsernames()
    usernames.splice(game.me.index, 1)
    let yourName = usernames[0]
    let you = game.brains[game.info.access].get(yourName)
    let youV = you.getVoltage(true)[you.usedChannels[0].index]
    let me = game.brains[game.info.access].get(game.me.username)
    let meV = me.getVoltage(true)[me.usedChannels[0].index]

    // Push buffer values to the EEG trace
    trace.update(
      trace.center[0] + meV[meV.length - 1]*Math.min(windowWidth,windowHeight)/4,
      trace.center[1] + youV[youV.length - 1]*Math.min(windowWidth,windowHeight)/4
    )

    // Image
    image(capture, windowWidth/2, windowHeight/2, windowWidth, windowWidth/(capture.width/capture.height));
    filter(GRAY);
    tint(255, 127);

    // Drawing
    for (let ind = 0; ind < trace.history.length - 3; ind++) {
      noFill()
      stroke(`rgba(${100}%,
                    ${100}%,
                     ${100}%,
${(ind/(trace.history.length-3))})`)
      strokeWeight(5)
      beginShape();
      curveVertex(trace.history[ind][0], trace.history[ind][1]);
      curveVertex(trace.history[ind + 1][0], trace.history[ind + 1][1]);
      curveVertex(trace.history[ind + 2][0], trace.history[ind + 2][1]);
      curveVertex(trace.history[ind + 3][0], trace.history[ind + 3][1]);
      endShape();
    }
  }
}


windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
  trace.center = [windowWidth/2,windowHeight/2];
  mapToggle.position(windowWidth - 25 - mapToggle.width, windowHeight - 25 - mapToggle.height);
}

function translateMercatorToScreen(x, y, d) {
    x = x //* windowWidth / ww;
    y = y //* (windowHeight / ratio) / hh;
    d = d * Math.min(windowWidth, windowHeight);
  return [x, y, d]
}


function mouseClicked() {
  points.forEach(point => {
    let transMX = mouseX - width / 2
    let transMY = mouseY - height / 2
    let [x, y, d] = translateMercatorToScreen(point.x, point.y, point.d)

    if (transMX < x + d / 2 && transMX > x - d / 2) {
      if (transMY < y + d / 2 && transMY > y - d / 2) {
        state = 1
        trace = new Trace(
          [windowWidth / 2, windowHeight / 2],
          10)
        capture = createCapture(VIDEO);
        capture.hide()
        mapToggle.show()
      }
    }
  })
}