const floorWidth = 50;
const floorLength = 1000;
const margin = 10;
let coinUnit = 3;

let coins = [];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 10, 530);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const floorGeometry = new THREE.BoxGeometry(floorWidth * 3, floorLength * 3, 1);
const floorMaterial = new THREE.MeshBasicMaterial( { color: 0x7cfc00 } );
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = 1.57;
scene.add(floor);

const playerGeometry = new THREE.BoxGeometry(2, 5, 2);
const playerMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 5, 500);
player.rotation.x = 0.5;
scene.add(player);

function Coin () {
  let laneSelection = Math.floor(Math.random() * 3);
  let laneDisplacement = (floorWidth - margin) / 2;

  objectGeometry = new THREE.ConeGeometry(coinUnit);
  objectMaterial = new THREE.MeshBasicMaterial( { color: 0xffd700 } );
  object = new THREE.Mesh(objectGeometry, objectMaterial);
  object.rotation.x = 180;
  object.position.set(laneDisplacement - (laneDisplacement * laneSelection), coinUnit + 1, -(floorLength - margin) / 2 );

  return object;
}

function generateCoins() {
  coinInterval = window.setInterval( function () {
    coin = new Coin();
    coins.push(coin);
    scene.add(coin);
    moveCoin(coin)
  }, 10000 );
}

function moveCoin(object) {
  coinMoveInterval = window.setInterval( function () {
    if ( object.position.z < floorLength / 2 + floorLength / 10 ) {
      // Change speed of coin by changing this distance
      object.position.z += 2;
    }
  }, 10 );
}

function checkCoins() {
  let coin;
  let coinPosition = new THREE.Vector3();

  coins.forEach(function(element, index) {
    coin = coins[index];
    coinPosition.setFromMatrixPosition( coin.matrixWorld );
    if (coinPosition.distanceTo(player.position) <= 10 && !coinsCollected.includes(coin)) {
      coinsCollected.push(coin);
    }
  });
}

document.addEventListener("keydown", onKeyDown, false);

function onKeyDown(event) {
  const key = event.key;
  if (key == 'ArrowLeft' && player.position.x != -(floorWidth - margin) / 2) {
    player.position.x -= (floorWidth - margin) / 2;
  } else if (key == 'ArrowRight' && player.position.x != (floorWidth - margin) / 2) {
    player.position.x += (floorWidth - margin) / 2;
  }
};

window.addEventListener("resize", onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  let brain = game.brains[game.info.access].get(game.me.username)
  if(brain){
    let [leftBlink, rightBlink] = brain.blink()
    if (leftBlink && player.position.x != -(floorWidth - margin) / 2) {
      player.position.x -= (floorWidth - margin) / 2;
    } else if (rightBlink && player.position.x != (floorWidth - margin) / 2) {
      player.position.x += (floorWidth - margin) / 2;
    }
  }

  // brain.getMetric('alpha').then((alpha) =>{
  //   playerMaterial.color.setRGB(0, 225, 255 + alpha.average/100)
  // })

  checkCoins();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

generateCoins();
animate();
