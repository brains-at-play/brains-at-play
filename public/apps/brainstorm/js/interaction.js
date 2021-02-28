
// Mouse Click

function mouseDown(ev){
        holdStatus = true;
        x = ev.clientX
        y = ev.clientY
        prev_x = x;
        prev_y = y;
}

function mouseUp(ev){
        holdStatus = false;
        vertexVel = new Array(pointCount*3).fill(0);
}

function mouseState() {
    if (holdStatus && moveStatus) {
        if (rotation){
            diff_x = (x - prev_x);
            diff_y = (y - prev_y)
        }
        prev_x = x;
        prev_y = y;
    }
}

function mousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return [evt.clientX - rect.left,evt.clientY - rect.top]
}

// Mouse Move 
function mouseMove(ev){
    moveStatus = true;
    x = ev.clientX
    y = ev.clientY
}

// Scroll
function wheelMove(ev) {
    if (zoom) {
        scroll = ev.deltaY;
        mat4.invert(viewMatrix, viewMatrix);
        mat4.translate(viewMatrix, viewMatrix, [0, 0, -cameraCurr]);
        cameraHome += scroll / 100;
        cameraCurr += scroll / 100;
        mat4.translate(viewMatrix, viewMatrix, [0, 0, cameraCurr]);
        mat4.invert(viewMatrix, viewMatrix);
    }
}


// Keyboard Shortcuts
function keyboardShortcuts(ev){
    let key_events = [
        37, // Left arrow
        38, // Up arrow
        39, // Right arrow
        40, // Down arrow
        49, // 1
        50, // 2
        51, // 3
        52, // 4
        73, // i
    ];
    if (key_events.includes(ev.keyCode)){
        if (ev.keyCode == '73') {
            toggleUI()
        }

        if (ev.keyCode == '49'){
            state = 1
        } else if (ev.keyCode == '50'){
            state = 2
        } else if (ev.keyCode == '51'){
            state = 3
        } else if (ev.keyCode == '52'){
            state = 4
        }

        if (ev.keyCode == '39' || ev.keyCode == '37') {

                if (ev.keyCode == '39' && state < (scenes.length-1))
                {
                    state += 1
                }
                else if (ev.keyCode == '37' && scenes[state-1].type != 'intro') {
                    state -= 1
                }
        }
    }
}
