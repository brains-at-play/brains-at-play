/* -------------------------- Utility Functions -------------------------- */

async function connectMuse(){
    await game.bluetooth.devices['muse'].connect()
    game.connectBluetoothDevice(brainsatplay.museClient)
                
}

function createAuxBuffer() {
    let buffers = Array.from({length: game.info.brains}, e => game.createBuffer(false, 1000));
    return buffers
}

async function updateAuxBuffer(metricName) {
    let data;
    if (metricName === 'voltage'){
        metricName = 'power'
    }   

    if (metricName === 'synchrony'){
        data = await game.getMetric('synchrony')
    } else {
        data = await game.brains[game.info.access].get(game.me.username).getMetric(metricName)
    }
    data = data.channels;
    data = data.filter(val => !isNaN(val))
    data.forEach((val,channel) => {
        auxBuffer[game.me.index][channel].shift()
        auxBuffer[game.me.index][channel].push(val)
    })
}

async function getChannelReadout(metricName) {

        let output;
        if (metricName === 'voltage'){
            metricName = 'power'
        }
        dict = await game.getMetric(metricName)
        output = dict.channels.filter((val) => !isNaN(val))
        return output
}



function flattenBrainData(metricName= 'voltage', normalize=false) {
        let usernames = game.getUsernames()
        let dataArray = []
        usernames.forEach((username,user) => {

            if (metricName === 'voltage'){
                let voltages = game.getVoltage(username,normalize)
                voltages = voltages.filter(arr => !isNaN(arr[0]))
                dataArray.push(...voltages.flat())
            } else {
                dataArray.push(...auxBuffer[user].flat())
            }
        })
        return dataArray
}


function closeNav() {
    document.getElementById("info-card").style.transform = "translateX(0px)";
    document.getElementById("navToggle").onclick = function() {openNav()};
    document.getElementById("nav-arrow").style.transform = 'rotate(135deg)'
    document.getElementById("navToggle").style.transform = 'translate(-100%)'
}

function openNav() {
    document.getElementById("info-card").style.transform = "translateX(-400px)";
    document.getElementById("navToggle").onclick =function() {closeNav()};
    document.getElementById("nav-arrow").style.transform = 'rotate(-45deg)'
    document.getElementById("navToggle").style.transform = 'translate(25px)'
}

function switchToChannels(pointCount){

    // Reset View Matrix
    viewMatrix = mat4.create();
    cameraHome = scenes[state].zoom;
    mat4.rotateX(viewMatrix, viewMatrix, Math.PI / 2);
    mat4.rotateY(viewMatrix, viewMatrix, Math.PI / 2);
    mat4.translate(viewMatrix, viewMatrix, [0, 0, cameraCurr]);
    mat4.invert(viewMatrix, viewMatrix);

    // Create signal dashboard
    let vertexHome = getChannels([],pointCount);
    let ease = true;
    let rotation = false;
    let zoom = false;

    return [vertexHome, viewMatrix, ease, rotation, zoom]
}

function distortToggle(){
    mouseDistort = !mouseDistort;

    if (mouseDistort){
        document.getElementById("effect-status").innerHTML = 'on';
    } else {
        document.getElementById("effect-status").innerHTML = 'off';

    }
}


function stateManager(forceUpdate=false){
    // Do We Have Vertices Defined OR Did State Change OR Is This Animation Over?
    if (forceUpdate || vertexHome == undefined || state != prevState || newSignalType || (scenes[state].timer && ((Date.now() - animStart)/1000 > scenes[state].timer))){

        if (scenes[state].timer && ((Date.now() - animStart)/1000 > scenes[state].timer)){
        state++;
    }

    let shapes = scenes[state].shapes

    // reset displacement if leaving channels visualization
    if (scenes[prevState].shapes.includes('channels')) {
        updateBufferData(attribs,'z_displacement',convertToWebGL(flattenBrainData('voltage',true), 0))
    }

    // set up variables for new state
    if (shapes.includes('brain')){
        vertexHome = [...brainVertices];
        ease = true;
        rotation = true;
        zoom = true;
    } 

    if (shapes.includes('channels')){
        cameraHome = scenes[state].zoom;
        [vertexHome, , ease, rotation, zoom] = switchToChannels(Math.round(pointCount/shapes.length),game.brains[game.info.access].size)
        if (uniformLocations != undefined){
            gl.uniform1i(uniformLocations.ambientNoiseToggle, 0);
        }

        // // toggle color
        if (scenes[state].signaltype == 'voltage'){
            gl.uniform1i(uniformLocations.colorToggle, 0);
        } else {
            gl.uniform1i(uniformLocations.colorToggle, 1);
        }
    }
    else {
        if (!newSignalType){
            viewMatrix = mat4.create();
            cameraHome = scenes[state].zoom;
            mat4.rotateX(viewMatrix, viewMatrix, Math.PI / 2);
            mat4.rotateY(viewMatrix, viewMatrix, Math.PI / 2);
            mat4.translate(viewMatrix, viewMatrix, [0, 0, cameraCurr]);
            mat4.invert(viewMatrix, viewMatrix);
        }
        if (uniformLocations != undefined){
            gl.uniform1i(uniformLocations.ambientNoiseToggle, 1);
            gl.uniform1i(uniformLocations.colorToggle, 1);
        }
    }

    if (!shapes.includes('brain') && !shapes.includes('channels')){
        vertexHome = createPointCloud(scenes[state].shapes, Math.round(pointCount/shapes.length));
        ease = true;
        rotation = false;
        zoom = false;
    }

    if (!rotation){
        diff_x = 0;
        diff_y = 0;
    }

    // Show Message
    document.getElementById('state').innerHTML = `${scenes[state].name}`
    document.getElementById('signal-type').innerHTML = `${scenes[state].signaltype}`

    // Change UI
    if (scenes[state].message != '') {
        announcement(scenes[state].message)
    }
    
    if (showUI && scenes[state].type != 'intro'){
        document.getElementById('ui-elements').style.opacity = '1.0'
    }

    // Remove signal options if effect is not compatible
    updateUI();

    // reset z_displacement to zero when not being actively updated
    if (!['z_displacement'].includes(scenes[state].effect) && dispBuffer != undefined){
        updateBufferData(attribs,'z_displacement',convertToWebGL(flattenBrainData(scenes[state].signaltype,false),0))
    }


    // Update Effect and Signal Type
    if (uniformLocations != undefined){
        gl.uniform1i(uniformLocations.effect, effects.indexOf(scenes[state].effect));
        gl.uniform1i(uniformLocations.signaltype, signaltypes.indexOf(scenes[state].signaltype));
    }

    // Start Animation Timer
    animStart = Date.now()

    newSignalType = false;
}
}

function announcement(message){
    document.getElementById('canvas-message').innerHTML = message;
    document.getElementById('canvas-message').style.opacity = 1.0;
    messageStartTime = Date.now();
}

function updateChannels(newChannels) {

        let shapes = scenes[state].shapes
        
        if (channels != newChannels) {
            channels = newChannels;
        SIGNAL_SUSTAIN = Math.round(SIGNAL_SUSTAIN_ORIGINAL/game.usedChannels.length)

        if (SIGNAL_SUSTAIN%2 == 0){
            SIGNAL_SUSTAIN += 1;
        }

        if (shapes.includes('channels')) {
            [vertexHome, , ease, rotation, zoom] = switchToChannels(Math.round(pointCount/shapes.length),game.brains[game.info.access].size)
        }

        let passedEEGCoords = [];
        Object.keys(game.eegCoordinates).forEach((name) => {
            if (game.usedChannelNames.indexOf(name) != -1){
                passedEEGCoords.push(game.eegCoordinates[name])
            } else {
                passedEEGCoords.push([NaN,NaN,NaN])

            }
        })

        gl.uniform3fv(uniformLocations.eeg_coords, new Float32Array(passedEEGCoords.flat()));
        } else {
        channels = newChannels;
    }
}


function bindChatSubmissionEvent(){
    document.getElementById('chat-form').addEventListener('submit',function(e) {
        e.preventDefault();
        if (!ws) {
            showMessage('No WebSocket connection');
            return;
        }
        ws.send(JSON.stringify({'destination':'chat',
            'msg': document.getElementById('message').value
        })
            );
            document.getElementById('message').value = '';
        return false;
    })
}


function toggleDevTools(){
    devTools = !devTools; 
    
    if (devTools){
        document.getElementById('developer-tools').style.left = '0'
        canvas.width = window.innerWidth - 200
        document.getElementById('bottom-info').style.width = `calc(100vw - 200px)`;
    } else {
        document.getElementById('developer-tools').style.left = '-200px'
        canvas.width = window.innerWidth
        document.getElementById('bottom-info').style.width = `100vw`;
    }
    document.getElementById('canvas-message').style.width = `${canvas.width}px`;
}

function toggleLoginScreen(){
    showLogin = !showLogin; 
    
    if (showLogin){
        document.getElementById('login-container').style.zIndex = '2'
        document.getElementById('login-container').style.opacity = '1'
    } else {
        document.getElementById('login-container').style.opacity = '0'
        document.getElementById('login-container').style.zIndex = '-1'
    }
}

function toggleSignUpScreen(){
    showSignUp = !showSignUp; 
    
    if (showSignUp){
        document.getElementById('signup-container').style.zIndex = '2'
        document.getElementById('signup-container').style.opacity = '1'
    } else {
        document.getElementById('signup-container').style.opacity = '0'
        document.getElementById('signup-container').style.zIndex = '0'
    }
}


function toggleChat(){
    chat = !chat; 
    
    if (chat){
        document.getElementById('chat').style.right = '0'
    } else {
        document.getElementById('chat').style.right = '-300px'
    }
}

function toggleAccess(){
    if (game.info.access == 'private'){
        game.access('public')
        document.getElementById('access-mode').innerHTML = 'Public Mode'
    } else {
        document.getElementById('access-mode').innerHTML = 'Private Mode'
        game.access('private')
        updateSignalType('signaltype', 'voltage')
    }
    updateUI()
}


function toggleUI(){
    showUI = !showUI;

    if (showUI){
        document.getElementById('ui-elements').style.display = 'block'
    } else {
            document.getElementById('ui-elements').style.display = 'none'
    }
}


function updateUI(){
    let dynamicSignalArray = ['delta', 'theta', 'alpha', 'beta', 'gamma']
    let opacity;
    let pointer;

    if (scenes[state].name == 'Group Dynamics'){
        document.getElementById('synchrony-readout').style.display = 'block'
    } else {
        document.getElementById('synchrony-readout').style.display = 'none'
    }

    if (game.connection.status === true){
        if (game.info.access == 'public'){
            let prevSig = document.getElementById('signal-type').innerHTML
            if (prevSig != 'synchrony'){
                updateSignalType('signaltype', 'synchrony')
            }

            document.getElementById('brain').style.opacity = '100%'
            document.getElementById('channels').style.opacity = '100%'
            document.getElementById('brain').style.pointerEvents = 'auto'
            document.getElementById('channels').style.pointerEvents = 'auto'
            document.getElementById('userinfo').style.opacity = '100%'
            document.getElementById('groupdynamics').style.opacity = '100%'
            document.getElementById('userinfo').style.pointerEvents = 'auto'
            if (game.info.brains < 2){
                document.getElementById('groupdynamics').style.opacity = '25%'
                document.getElementById('groupdynamics').style.pointerEvents = 'none'
                document.getElementById('userinfo').style.opacity = '25%'
                document.getElementById('userinfo').style.pointerEvents = 'none'
            } else {
                document.getElementById('groupdynamics').style.opacity = '100%'
                document.getElementById('groupdynamics').style.pointerEvents = 'auto'
                document.getElementById('userinfo').style.opacity = '100'
                document.getElementById('userinfo').style.pointerEvents = 'auto'
            }


            dynamicSignalArray.push('synchrony')
            dynamicSignalArray.push('voltage')

            dynamicSignalArray.forEach((id) => {
                    document.getElementById(id).style.opacity = '0%'
                    document.getElementById(id).style.pointerEvents = 'none'
            })
        } else {
            document.getElementById('brain').style.opacity = '100%'
            document.getElementById('channels').style.opacity = '100%'
            document.getElementById('brain').style.pointerEvents = 'auto'
            document.getElementById('channels').style.pointerEvents = 'auto'
            document.getElementById('userinfo').style.opacity = '25%'
            document.getElementById('groupdynamics').style.opacity = '25%'
            document.getElementById('userinfo').style.pointerEvents = 'none'
            document.getElementById('groupdynamics').style.pointerEvents = 'none'

            if (['projection','z_displacement'].includes(scenes[state].effect)){
                dynamicSignalArray.push(...['voltage'])
                opacity = '100%'
                pointer = 'auto'
                document.getElementById('synchrony').style.opacity = '0%'
                document.getElementById('synchrony').style.pointerEvents = 'none'
            } else {
                opacity = '0%'
                pointer = 'none'
            }

            dynamicSignalArray.forEach((id) => {
                    document.getElementById(id).style.opacity = opacity
                    document.getElementById(id).style.pointerEvents = pointer
            })
        }
    } else {
            document.getElementById('brain').style.opacity = '100%'
            document.getElementById('channels').style.opacity = '100%'
            document.getElementById('userinfo').style.opacity = '100%'
            document.getElementById('groupdynamics').style.opacity = '100%'
            document.getElementById('brain').style.pointerEvents = 'auto'
            document.getElementById('channels').style.pointerEvents = 'auto'
            document.getElementById('userinfo').style.pointerEvents = 'auto'
            document.getElementById('groupdynamics').style.pointerEvents = 'auto'

            dynamicSignalArray.push(...['voltage','synchrony'])
            if (['projection','z_displacement'].includes(scenes[state].effect)){
                opacity = '100%'
                pointer = 'auto'
            } else {
                opacity = '0%'
                pointer = 'none'
            }

            dynamicSignalArray.forEach((id) => {
                    document.getElementById(id).style.opacity = opacity
                    document.getElementById(id).style.pointerEvents = pointer
            })
    }
}

// Resizing
window.onresize = function() {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    if (devTools){
        canvas.width -= 200;
    }
    document.getElementById('canvas-message').style.width = `${canvas.width}px`;
}

function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
   
    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {
   
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
  }
  


  // Pare Down Verbosity

  function programShaders(gl){
      // Create Shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vertexShader, BRAINSTORM_VERTEX_SHADER_SOURCE);
      gl.compileShader(vertexShader);
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, BRAINSTORM_FRAGMENT_SHADER_SOURCE);
      gl.compileShader(fragmentShader);
  
      // Attach Shaders to Program
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      return gl, program
  }

  function initializeAttributes(gl, program, arrays){
      let attribs = {}
      for (key in arrays) {
        attribs[key] = {}
        attribs[key]['buffer'] = gl.createBuffer()
        attribs[key]['location'] =  gl.getAttribLocation(program, key);
        gl.enableVertexAttribArray(attribs[key]['location']);
        gl.bindBuffer(gl.ARRAY_BUFFER, attribs[key]['buffer'])
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrays[key].data), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(attribs[key]['location'], arrays[key].numComponents, gl.FLOAT, false, 0, 0);
      }

      return gl, program, attribs
  }

  function updateBufferData(attribs, name, data){
    gl.bindBuffer(gl.ARRAY_BUFFER, attribs[name].buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
  }

  // Rotation
  function rotate(scene, dx,dy){

    if (!scene.shapes.includes('channels')){
        dx += AUTO_ROTATION_X;
    }
    mat4.invert(viewMatrix, viewMatrix);
    mat4.translate(viewMatrix, viewMatrix, [0, 0, -cameraCurr]);
    mat4.rotateY(viewMatrix, viewMatrix, -dx*2*Math.PI/canvas.height);
    mat4.rotateX(viewMatrix, viewMatrix, -dy*2*Math.PI/canvas.width);
    mat4.translate(viewMatrix, viewMatrix, [0, 0, cameraCurr]);
    mat4.invert(viewMatrix, viewMatrix);

  }

// Easing
function easeCamera(){
    if (cameraHome != cameraCurr) {

        // Reset camera in context
        mat4.invert(viewMatrix, viewMatrix);
        mat4.translate(viewMatrix, viewMatrix, [0, 0, -cameraCurr]);

        // Update camera position
        diff = cameraHome - cameraCurr
        if (Math.abs(diff) <= epsilon) {
            cameraCurr = cameraHome;
        } else {
            cameraCurr += scenes[state].ease * diff;
        }

        // Move to new position
        mat4.translate(viewMatrix, viewMatrix, [0, 0, cameraCurr]);
        mat4.invert(viewMatrix, viewMatrix);
    }
}

function easeVertices() {
    // Ease points around
    if (ease){
        let count = 0;
        let home;
        let curr;
        for (let point =0; point < vertexHome.length/3; point++){
            for (let ind=0;ind < 3; ind++) {
                    home = vertexHome[3 * point + ind];
                    curr = vertexCurr[3 * point + ind]
                    if (!isNaN(home) && !isNaN(curr)){
                    if (Math.abs(home - curr) <= epsilon) {
                        vertexCurr[3 * point + ind] = vertexHome[3 * point + ind];
                        count++
                    }
                    else {
                        vertexCurr[3 * point + ind] += scenes[state].ease * (home - curr);
                    }
                } else{
                    if (isNaN(home)){
                        vertexCurr[3 * point + ind] = NaN;
                        count++;
                    } else {
                        vertexCurr[3 * point + ind] = (Math.random()-0.5)*GENERIC_ZOOM;
                    }
                }
            }
        }

        updateBufferData(attribs,'position',vertexCurr)

        if (count == vertexHome.length){
            ease = false
        }
    }
}

function easeSynchrony() {

    game.getMetric('synchrony').then((homeSync) => {
    if (!isNaN(homeSync.average)) {
        easedSynchrony += scenes[state].ease * (homeSync.average - easedSynchrony);
    }
})
}



function lagDrawMode() {
    if (scenes[state].render != gl.POINTS){
        if (renderLagStart == undefined || (renderLagStart == false && newSignalType)){
            renderLagStart = Date.now();
        }
        if (Date.now() - renderLagStart >= 500){
            renderState = state
            renderLagStart = false;
        }
    } else if (renderState != state){
        renderState = state
        renderLagStart = undefined;
    }
}

function updateColorsByChannel() {

        if (scenes[state].signaltype) {
            if (['projection', 'z_displacement'].includes(scenes[state].effect)) {
                if (['projection'].includes(scenes[state].effect)) {
                    updateAuxBuffer(scenes[state].signaltype)
                    getChannelReadout(scenes[state].signaltype).then((channels) => {
                        gl.uniform1fv(uniformLocations.eeg_signal, new Float32Array(channels));
                        updateBufferData(attribs, 'z_displacement', new Array(pointCount).fill(0))
                        })
                }
                if (['z_displacement'].includes(scenes[state].effect)) {
                    if (scenes[state].signaltype == 'voltage') {
                        updateBufferData(attribs, 'z_displacement', convertToWebGL(flattenBrainData('voltage',true).map(val => val*25), 0))
                    } else {
                        updateAuxBuffer(scenes[state].signaltype)
                        updateBufferData(attribs, 'z_displacement', convertToWebGL(flattenBrainData(scenes[state].signaltype,false), 0))
                    }
                }
            } else {
                updateBufferData(attribs, 'z_displacement', new Array(pointCount).fill(0))
                getChannelReadout(scenes[state].signaltype).then(channels => {
                    gl.uniform1fv(uniformLocations.eeg_signal, new Float32Array(channels));
                    })            
                }
        } else {
            getChannelReadout(scenes[state].signaltype).then(channels => {
                gl.uniform1fv(uniformLocations.eeg_signal, new Float32Array(channels));
                updateBufferData(attribs, 'z_displacement', new Array(pointCount).fill(0))})
        }
}


// Update Signal Type

function updateSignalType(method, val){
    let prevSig = document.getElementById('signal-type').innerHTML
    let thisSig;
    if (method == 'signaltype'){
        if (prevSig != val){
            thisSig = val
        }
    } else if (method == 'element') {
        thisSig= val.firstElementChild.innerHTML.toLowerCase()
    } else {
        thisSig = 'undefined';
    }
    if (prevSig != thisSig){
        scenes[state].signaltype = thisSig;
        document.getElementById('signal-type').innerHTML = thisSig;
        newSignalType = true;
        gl.uniform1i(uniformLocations.signaltype, signaltypes.indexOf(scenes[state].signaltype));

        // Update Auxillary Buffer
        auxBuffer = createAuxBuffer();
    }
}

function brainDependencies(updateArray){

    updateArray.forEach((updateObj) => {
    if (updateObj.destination !== undefined && updateObj.destination.length != 0) {
    if (updateObj.destination == 'opened'){
        state = 1;
        stateManager(true)
    } else if (updateObj.destination == 'error'){
        console.log('error')
        announcement('WebSocket error.\n Please refresh your browser and try again.');
    } else if (updateObj.destination == 'init'){
        stateManager(true)

        // Announce number of brains currently online
        if ((game.info.access === 'public') && game.info.simulated == false) {
            if (updateObj.nBrains > 0) {
                announcement(`<div>Welcome to the Brainstorm
                            <p class="small">${game.info.brains} brains online</p></div>`)
            } else {
                announcement(`<div>Welcome to the Brainstorm
                                <p class="small">No brains online</p></div>`)
            }
        }
        document.getElementById('nBrains').innerHTML = `${game.info.brains}`
        document.getElementById('nInterfaces').innerHTML = `${game.info.interfaces}`

    } else if (updateObj.destination == 'update'){

        if (state != 0){
            stateManager(true)
        }

        document.getElementById('nBrains').innerHTML = `${game.info.brains}`

        if (game.info.brains == 0 && (game.info.access == 'public')){
            announcement('all players left the brainstorm')
        }
        document.getElementById('nBrains').innerHTML = `${game.info.brains}`
        }

        if (game.info.access == 'private'){
            document.getElementById('nInterfaces').innerHTML = `1`
        } else {
            document.getElementById('nInterfaces').innerHTML = `${game.info.interfaces}`
        }
    } else if (updateObj.destination == 'closed'){
        updateUI();
    }
})
}


 // WebGL Conversion

 function convertToWebGL(flattenedArray, filler){
     let currDataPoints = flattenedArray.length
     let upsamplingFactor = Math.floor(pointCount/currDataPoints)

    // factor must be odd
     if (upsamplingFactor%2 == 0){
         upsamplingFactor += 1;
     }

     let newArray = new Array(pointCount).fill(filler)

     for (i = 0; i < currDataPoints; i++){
         for (j = 0; j < upsamplingFactor; j++){
            newArray[(i*upsamplingFactor) + j] = flattenedArray[i]
         }
     }
      
     return newArray
 }


 // Perlin Noise
// Ported from Stefan Gustavson's java implementation
// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
// Read Stefan's excellent paper for details on how this code works.
//
// Sean McCullough banksean@gmail.com

/**
 * You can pass in a random number generator object if you like.
 * It is assumed to have a random() method.
 */
var ClassicalNoise = function(r) { // Classic Perlin noise in 3D, for comparison
    if (r == undefined) r = Math;
    this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
        [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
        [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    this.p = [];
    for (var i=0; i<256; i++) {
        this.p[i] = Math.floor(r.random()*256);
    }
    // To remove the need for index wrapping, double the permutation table length
    this.perm = [];
    for(var i=0; i<512; i++) {
        this.perm[i]=this.p[i & 255];
    }
};

ClassicalNoise.prototype.dot = function(g, x, y, z) {
    return g[0]*x + g[1]*y + g[2]*z;
};

ClassicalNoise.prototype.mix = function(a, b, t) {
    return (1.0-t)*a + t*b;
};

ClassicalNoise.prototype.fade = function(t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
};

// Classic Perlin noise, 3D version
ClassicalNoise.prototype.noise = function(x, y, z) {
    // Find unit grid cell containing point
    var X = Math.floor(x);
    var Y = Math.floor(y);
    var Z = Math.floor(z);

    // Get relative xyz coordinates of point within that cell
    x = x - X;
    y = y - Y;
    z = z - Z;

    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255;
    Y = Y & 255;
    Z = Z & 255;

    // Calculate a set of eight hashed gradient indices
    var gi000 = this.perm[X+this.perm[Y+this.perm[Z]]] % 12;
    var gi001 = this.perm[X+this.perm[Y+this.perm[Z+1]]] % 12;
    var gi010 = this.perm[X+this.perm[Y+1+this.perm[Z]]] % 12;
    var gi011 = this.perm[X+this.perm[Y+1+this.perm[Z+1]]] % 12;
    var gi100 = this.perm[X+1+this.perm[Y+this.perm[Z]]] % 12;
    var gi101 = this.perm[X+1+this.perm[Y+this.perm[Z+1]]] % 12;
    var gi110 = this.perm[X+1+this.perm[Y+1+this.perm[Z]]] % 12;
    var gi111 = this.perm[X+1+this.perm[Y+1+this.perm[Z+1]]] % 12;

    // The gradients of each corner are now:
    // g000 = grad3[gi000];
    // g001 = grad3[gi001];
    // g010 = grad3[gi010];
    // g011 = grad3[gi011];
    // g100 = grad3[gi100];
    // g101 = grad3[gi101];
    // g110 = grad3[gi110];
    // g111 = grad3[gi111];
    // Calculate noise contributions from each of the eight corners
    var n000= this.dot(this.grad3[gi000], x, y, z);
    var n100= this.dot(this.grad3[gi100], x-1, y, z);
    var n010= this.dot(this.grad3[gi010], x, y-1, z);
    var n110= this.dot(this.grad3[gi110], x-1, y-1, z);
    var n001= this.dot(this.grad3[gi001], x, y, z-1);
    var n101= this.dot(this.grad3[gi101], x-1, y, z-1);
    var n011= this.dot(this.grad3[gi011], x, y-1, z-1);
    var n111= this.dot(this.grad3[gi111], x-1, y-1, z-1);
    // Compute the fade curve value for each of x, y, z
    var u = this.fade(x);
    var v = this.fade(y);
    var w = this.fade(z);
    // Interpolate along x the contributions from each of the corners
    var nx00 = this.mix(n000, n100, u);
    var nx01 = this.mix(n001, n101, u);
    var nx10 = this.mix(n010, n110, u);
    var nx11 = this.mix(n011, n111, u);
    // Interpolate the four results along y
    var nxy0 = this.mix(nx00, nx10, v);
    var nxy1 = this.mix(nx01, nx11, v);
    // Interpolate the two last results along z
    var nxyz = this.mix(nxy0, nxy1, w);

    return nxyz;
};
