import * as THREE from './build/three.module.js';
import Stats from './libs/stats.module.js';
import { GUI } from './libs/dat.gui.module.js';

import { GLTFLoader } from './loaders/GLTFLoader.js';

let floorWidth = 50;
let floorLength = 1000;
let margin = 10;
let coinUnit = 3;

let stats, clock, gui, mixer, actions, activeAction, previousAction;
let model, face;

let coins = [];

// 0: 0 < x < 0.1
// 1: 0.1 <= x < 0.1
//etc...
let alphaValue;

let scene = new THREE.Scene();
scene.background = new THREE.Color( 0xe0e0e0 );
//scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 10, 530);


let renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( window.devicePixelRatio );
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

let floorGeometry = new THREE.BoxGeometry(floorWidth * 3, floorLength * 3, 1);
let floorMaterial = new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } );
let floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = 1.57;
scene.add(floor);

function Coin(isGood) {
  let laneSelection = Math.floor(Math.random() * 3);
  let laneDisplacement = (floorWidth - margin) / 2;

  let objectGeometry = new THREE.ConeGeometry(coinUnit);
  let objectMaterial;

  if (isGood) {
    objectMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  } else {
    objectMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
  }

  let object = new THREE.Mesh(objectGeometry, objectMaterial);
  object.rotation.x = 180;
  object.position.set(laneDisplacement - (laneDisplacement * laneSelection), coinUnit + 1, -(floorLength - margin) / 2 );

  return object;
}

function generateCoins() {
  let coinInterval = window.setInterval( function () {
    let coin = new Coin();
    coins.push(coin);
    scene.add(coin);
    moveCoin(coin)
  }, 10000 );
}

function moveCoin(object) {
  let coinMoveInterval = window.setInterval( function () {
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
    if (coinPosition.distanceTo(model.position) <= 5 && !coinsCollected.includes(coin)) {
      coin.material.transparent = true;
      coin.material.opacity = 0;
      coin.visible = false;
      coinsCollected.push(coin);
    }
  });
}


// Code for robot

let api = { state: 'Walking' };

function init() {
  clock = new THREE.Clock();

  // lights
  let hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
  hemiLight.position.set( 0, 20, 0 );
  scene.add( hemiLight );

  let dirLight = new THREE.DirectionalLight( 0xffffff );
  dirLight.position.set( 0, 20, 10 );
  scene.add( dirLight );

  // ground

  /*let grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add( grid );*/

  // model
  let loader = new GLTFLoader();
  loader.load( 'models/RobotExpressive.glb', function ( gltf ) {

    model = gltf.scene;
    model.position.set(0, 5, 500);
    model.rotation.y = 3.14;
    scene.add( model );

    createGUI( model, gltf.animations );

  }, undefined, function ( e ) {

    console.error( e );
  } );

  // stats
  stats = new Stats();
  document.body.appendChild( stats.dom );
}

function createGUI( model, animations ) {

  let states = [ 'Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing' ];
  let emotes = [ 'Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp' ];

  gui = new GUI();

  mixer = new THREE.AnimationMixer( model );

  actions = {};

  for (let i = 0; i < animations.length; i ++) {
    let clip = animations[ i ];
    let action = mixer.clipAction( clip );
    actions[ clip.name ] = action;

    if ( emotes.indexOf( clip.name ) >= 0 || states.indexOf( clip.name ) >= 4 ) {
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;
    }
  }

  // states

  let statesFolder = gui.addFolder( 'States' );

  let clipCtrl = statesFolder.add( api, 'state' ).options( states );

  clipCtrl.onChange( function () {

    fadeToAction( api.state, 0.5 );

  } );

  //statesFolder.open();

  // emotes

  let emoteFolder = gui.addFolder( 'Emotes' );

  function createEmoteCallback( name ) {

    api[ name ] = function () {
      fadeToAction( name, 0.2 );
      mixer.addEventListener( 'finished', restoreState );

    };

    emoteFolder.add( api, name );

  }

  function restoreState() {
    mixer.removeEventListener( 'finished', restoreState );
    fadeToAction( api.state, 0.2 );
  }

  for ( let i = 0; i < emotes.length; i ++ ) {
    createEmoteCallback( emotes[ i ] );
  }

  //emoteFolder.open();

  // expressions

  face = model.getObjectByName( 'Head_4' );

  let expressions = Object.keys( face.morphTargetDictionary );
  let expressionFolder = gui.addFolder( 'Expressions' );

  for ( let i = 0; i < expressions.length; i ++ ) {

    expressionFolder.add( face.morphTargetInfluences, i, 0, 1, 0.01 ).name( expressions[ i ] );

  }

  activeAction = actions[ 'Running' ];
  activeAction.play();

  //expressionFolder.open();
}

function fadeToAction( name, duration ) {
  previousAction = activeAction;
  activeAction = actions[ name ];

  if ( previousAction !== activeAction ) {

    previousAction.fadeOut( duration );

  }

  activeAction
    .reset()
    .setEffectiveTimeScale( 1 )
    .setEffectiveWeight( 1 )
    .fadeIn( duration )
    .play();
}

document.addEventListener("keydown", onKeyDown, false);

function onKeyDown(event) {
  let key = event.key;
  if (key == 'ArrowLeft' && model.position.x != -(floorWidth - margin) / 2) {
    model.position.x -= (floorWidth - margin) / 2;
  } else if (key == 'ArrowRight' && model.position.x != (floorWidth - margin) / 2) {
    model.position.x += (floorWidth - margin) / 2;
  }
};

window.addEventListener("resize", onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/*setAlpha(alpha) {

}*/

function animate() {
  let brain = game.brains[game.info.access].get(game.me.username)
  if(brain){
    let [leftBlink, rightBlink] = brain.blink()
    if (leftBlink && model.position.x != -(floorWidth - margin) / 2) {
      model.position.x -= (floorWidth - margin) / 2;
    } else if (rightBlink && model.position.x != (floorWidth - margin) / 2) {
      model.position.x += (floorWidth - margin) / 2;
    }
  }

   /*brain.getMetric('alpha').then((alpha) =>{
     setAlpha();
     //modelMaterial.color.setRGB(0, 225, 255 + alpha.average/100)
   })*/

  checkCoins();

  let dt = clock.getDelta();
  if ( mixer ) mixer.update( dt );

  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  stats.update();
}

init();
generateCoins();
animate();
