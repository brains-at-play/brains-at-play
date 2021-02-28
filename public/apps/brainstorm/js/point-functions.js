const every_nth = (arr, offset, nth) => arr.filter((e, i) => (i+offset) % nth === nth - 1);

function convertToMesh(pointCloud){
    let slice;
    let output = [];
    for (let ind = 0; ind < (pointCloud.length/3); ind++){
        slice = pointCloud.slice(ind, ind+9)
        output.push(...slice)
    }
    return output
}

function reducePointCount(pointCloud,desiredCount){
    let slice;
    let output = [];
    let usedInds = [];

    for (let i = 0; i < pointCloud.length/3; i+=Math.ceil((pointCloud.length/3)/desiredCount)){
        slice = pointCloud.slice(i*3, (i*3)+3)
        output.push(...slice)
        usedInds.push(i)
    }

    let remainder = desiredCount - (output.length/3)

    for (let i =0; i < remainder; i++){
        output.push(...pointCloud.slice((usedInds[i]+1)*3, ((usedInds[i]+1)*3)+3))
    }

    return output
}

function createPointCloud(pointFunction, pointCount) {

    let pointCloud = [];
    let numUsers = game.brains[game.info.access].size
    if (numUsers == 0){
        numUsers = 1;
    }
    if (pointFunction == 'brains'){
            let oneBrain = reducePointCount(brainVertices, Math.floor((brainVertices.length/3)/numUsers))
            let dim_size = Math.ceil(Math.sqrt(numUsers));

            if (dim_size == 1){delta = 0; z_window = 0} else{
                z_window = scenes[state].zoom/4;
                delta = (2*z_window)/(dim_size-1)
            }
            let row = 0;
            let col = -1;
    
            let tempBrain;

            for (let i = 0; i < numUsers; i++) {
                tempBrain = [...oneBrain];
                if (i % dim_size == 0) {
                    row = 0;
                    col++;
                }
                for (let point = 0; point < (oneBrain.length/3); point++){
                    tempBrain[3*point] /= dim_size;
                    tempBrain[3*point+1] /= dim_size;
                    tempBrain[3*point+2] /= dim_size;
    
                    tempBrain[3*point+1] += -z_window + (delta) * col;
                    tempBrain[3*point+2] += -z_window + (delta) * row;
            }
    
    
            if (numUsers == 1) {
                pointCloud = tempBrain;
            } else {
                pointCloud = pointCloud.concat(tempBrain);
            }
                row++
            }
        }
        else if (pointFunction == 'channels') {
            pointCloud = getChannels(pointCloud,pointCount)
        } else if (pointFunction == shapes.sphereShells) {
            let dim_size = Math.ceil(Math.sqrt(numUsers));
            if (dim_size == 1){delta = 0; z_window = 0} else{
                z_window = INNER_Z;
                delta = (2*INNER_Z)/(dim_size-1)
            }
            let row = 0;
            let col = -1;
            for (let i = 0; i < numUsers; i++) {
                if (i % dim_size == 0) {
                    row = 0;
                    col++;
                }
                for (let j = 0; j < Math.floor(pointCount / numUsers); j++) {
                    const r = () => (Math.random() - 0.5);
                    let point = pointFunction(r(), r(), r());
    
                    // Reduce point radius
                    point[0] /= dim_size;
                    point[1] /= dim_size;
                    point[2] /= dim_size;
    
                    // Shift spheres
                    point[1] += -z_window + (delta) * col;
                    point[2] += -z_window + (delta) * row;
    
                    pointCloud.push(...point);
                }
                row++
            }
        }
        else{
                for (let i = 0; i < pointCount; i++) {
                const r = () => (Math.random() - 0.5);
                const point = shapes[pointFunction](r(), r(), r());
                pointCloud.push(...point.map((val) => {return val*scenes[state].zoom/2.5}));
            }
        }
        
        return pointCloud;
    }

const shapes = {

    box(...position) {
        return position;
    },

    boxShell(...position) {
        const distToWall = a => 0.5-Math.abs(a);
        const normalize1D = n => n/Math.abs(n);

        const dists = position.map(distToWall);
        const minDistToWall = Math.min(...dists);

        if (minDistToWall == dists[0]) {
            position[0] = 0.5 * normalize1D(position[0]);
        } else if (minDistToWall == dists[1]) {
            position[1] = 0.5 * normalize1D(position[1]);
        } else if (minDistToWall == dists[2]) {
            position[2] = 0.5 * normalize1D(position[2]);
        }

        return position;
    },

    sphere(...position) {
        const R = 1;

        const normalize1D = n => n/Math.abs(n);
        let [r, a, b] = position.map(n=> n + 0.5);
        r *= R;
        a *= 2 * Math.PI;   // 0 < a < 2PI
        b = position[2] * 2;   // -1 < b < 1

        let x = r * Math.cos(a);
        let y = r * Math.sin(a);
        let z = b * Math.sqrt(R*R-r*r);

        return [x,y,z];
    },

    sphereShell(...position) {
        return vec3.normalize(vec3.create(), position.map)
    },

    sphereShells(...position) {
        return vec3.normalize(vec3.create(), position)
    },

    sphereShell2(...position) {
        const R = 1;

        const normalize1D = n => n/Math.abs(n);
        let [r, a, b] = position.map(n=> n + 0.5);
        r *= R;
        a *= 2 * Math.PI;   // 0 < a < 2PI
        b = position[2] * 2;   // -1 < b < 1

        let x = r * Math.cos(a);
        let y = r * Math.sin(a);
        let z = normalize1D(b) * Math.sqrt(R*R-r*r);

        return [x,y,z];
    },

    cylinderShellInfinte(...position) {
        const R = 1;

        let [_, a, b] = position.map(n=> n + 0.5);
        a *= 2 * Math.PI;   // 0 < a < 2PI
        b *= 2 * Math.PI;   // 0 < b < 2PI

        let x = R * Math.cos(a);
        let y = R * Math.sin(a);
        let z = Math.tan(b);

        return [x,y,z];
    },

    cone(...position) {
        const R = 1;

        let [r, a, b] = position.map(n=> n + 0.5);
        r *= R;
        a *= 2 * Math.PI;   // 0 < a < 2PI

        let x = r * Math.cos(a);
        let y = r * Math.sin(a);
        let z = b * (R-r);

        return [x,y,z];
    },

    coneShell(...position) {
        const R = 1;

        let [r, a, b] = position.map(n=> n + 0.5);
        r *= R;
        a *= 2 * Math.PI;   // 0 < a < 2PI

        let x = r * Math.cos(a);
        let y = r * Math.sin(a);
        let z = R-r;

        return [x,y,z];
    },

    cylinder(...position) {
        const R = 1;

        let [r, a, _] = position.map(n=> n + 0.5);
        r *= R;
        a *= 2 * Math.PI;   // 0 < a < 2PI

        let x = r * Math.cos(a);
        let y = r * Math.sin(a);
        let z = position[2];

        return [x,y,z];
    },

    cylinderShell(...position) {
        const R = 1;

        let [r, a, _] = position.map(n=> n + 0.5);
        r *= R;
        a *= 2 * Math.PI;   // 0 < a < 2PI

        let x = R * Math.cos(a);
        let y = R * Math.sin(a);
        let z = position[2];

        return [x,y,z];
    },

    circularHyperboloid(...position) { // maybe??
        let [_, a, b] = position.map(n=> n + 0.5);
        a *= 2 * Math.PI;   // 0 < a < 2PI
        b *= 2 * Math.PI;   // 0 < b < 2PI

        let x = Math.cos(a) / Math.cos(b);
        let y = Math.sin(a) / Math.cos(b);
        let z = Math.sin(b);

        return [x,y,z];
    },
};

function getChannels(pointCloud, pointCount) {
    let numUsers = game.brains[game.info.access].size
    if (numUsers == 0){
        numUsers = 1;
    }
    let numChannels = game.usedChannels.length
    if (numChannels == 0){
        numChannels = 16;
    }
    let user = -1;
    let y;
    let z;
    let channel_trigger = game.brains[game.info.access].get(game.getUsernames()[0]).bufferSize // Single-brain buffer size
    let user_trigger = channel_trigger*numChannels
    let currDataPoints = channel_trigger*numChannels*numUsers
    let upsamplingFactor = Math.floor(pointCount/(currDataPoints)) // account for doubling (due to line drawing)

    let drawArea = {w: 0.8*(canvas.getBoundingClientRect().width), h: 0.8*(canvas.getBoundingClientRect().height)}
    let z_iter = ((drawArea.h)/(2*numChannels))
    let y_iter = (drawArea.w/ (channel_trigger*upsamplingFactor))

   // factor must be odd
    if (upsamplingFactor%2 !== 0){
        upsamplingFactor += 1;
    }

    for (let i = 0; i < (currDataPoints-1)/2; i++) {

        // Reset channel
        if (i*2 % channel_trigger == 0){
            z += z_iter;
            y = -drawArea.w/4;
        }

        // reset user
        if (i*2 % user_trigger == 0){
            z = -(z_iter)*(numChannels/2) + z_iter/2;
            y = -drawArea.w/4;
            user++;
        }


        for (let j = 0; j < upsamplingFactor; j++){
                pointCloud.push(...[1.0*user,y,z])
                pointCloud.push(...[1.0*user,y+y_iter,z])
                y += y_iter;
         }
    }

    console.log(pointCount * 3 - pointCloud.length)

    while (pointCloud.length != pointCount * 3){
        pointCloud.push(NaN)
    }
    return pointCloud
}

