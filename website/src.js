//THREEJS RELATED VARIABLES 

var scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  shadowLight,
  light,
  renderer,
  container;

//SCREEN VARIABLES 
var HEIGHT,
  WIDTH,
  windowHalfX,
  windowHalfY,
  xLimit,
  yLimit;

// FISH BODY PARTS
var fish,
  bodyFish,
  tailFish,
  topFish,
  rightIris,
  leftIris,
  rightEye,
  leftEye,
  lipsFish,
  tooth1,
  tooth2,
  tooth3,
  tooth4,
  tooth5;

// Max window width to display the fish
const MAX_WIDTH = 1440;

// FISH SPEED
// the colors are splitted into rgb values to facilitate the transition of the color
var fishFastColor = { r: 0, g: 181, b: 195 }; // pastel blue
fishSlowColor = { r: 80, g: 235, b: 235 }; // purple
angleFin = 0; // angle used to move the fishtail

// PARTICLES COLORS
// array used to store a color scheme to randomly tint the particles 
var colors = ['#dff69e',
  '#00ceff',
  '#002bca',
  '#ff00e0',
  '#3f159f',
  '#71b583',
  '#00a2ff'];

// PARTICLES
// as the particles are recycled, I use 2 arrays to store them
// flyingParticles used to update the flying particles and waitingParticles used to store the "unused" particles until we need them;
var flyingParticles = [];
waitingParticles = [];
// maximum z position for a particle
maxParticlesZ = 600;

// SPEED
var speed = { x: 0, y: 0 };
var smoothing = 10;

// MISC
var mousePos = { x: 0, y: 0 };
var stats;
var halfPI = Math.PI / 2;


function init() {
  // To work with THREEJS, you need a scene, a camera, and a renderer

  // create the scene;
  scene = new THREE.Scene();

  // create the camera
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1; // the camera won't "see" any object placed in front of this plane
  farPlane = 2000; // the camera wont't see any object placed further than this plane
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane);
  camera.position.z = 1000;


  //create the renderer 
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  /*
  As I will recycle the particles, I need to know the left and right limits they can fly without disappearing from the camera field of view.
  As soon as a particle is out of the camera view, I can recycle it : remove it from the flyingParticles array and push it back in the waitingParticles array.
  I guess I can do that by raycasting each particle each frame, but I think this will be too heavy. Instead I prefer to precalculate the x coordinate from which a particle is not visible anymore. But this depends on the z position of the particle.
  Here I decided to use the furthest possible z position for a particle, to be sure that all the particles won't be recycled before they are out of the camera view. But this could be much more precise, by precalculating the x limit for each particle depending on its z position and store it in the particle when it is "fired". But today, I'll keep it simple :) 
  !!!!!! I'm really not sure this is the best way to do it. If you find a better solution, please tell me  
  */

  // convert the field of view to radians
  var ang = (fieldOfView / 2) * Math.PI / 180;
  // calculate the max y position seen by the camera related to the maxParticlesZ position, I start by calculating the y limit because fielOfView is a vertical field of view. I then calculate the x Limit
  yLimit = (camera.position.z + maxParticlesZ) * Math.tan(ang); // this is a formula I found, don't ask me why it works, it just does :) 
  // Calculate the max x position seen by the camera related to the y Limit position
  xLimit = yLimit * camera.aspect;

  // precalculate the center of the screen, used to update the speed depending on the mouse position
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;


  // handling resize and mouse move events
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', handleMouseMove, false);
  //// let's make it work on mobile too
  // let's not make it work on mobile
  // document.addEventListener('touchstart', handleTouchStart, false);
  // document.addEventListener('touchend', handleTouchEnd, false);
  // document.addEventListener('touchmove',handleTouchMove, false);
}

function onWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix(); // force the camera to update its aspect ratio
  // recalculate the limits
  var ang = (fieldOfView / 2) * Math.PI / 180;
  yLimit = (camera.position.z + maxParticlesZ) * Math.tan(ang);
  xLimit = yLimit * camera.aspect;
}

function handleMouseMove(event) {
  mousePos = { x: event.clientX, y: event.clientY };
  updateSpeed()
}

function updateSpeed() {
  speed.x = (mousePos.x / WIDTH) * 100;
  speed.y = (mousePos.y - windowHalfY) / 10;
}

function loop() {

  // Update fish position, rotation, scale... depending on the mouse position
  // To make a smooth update of each value I use this formula :
  // currentValue += (targetValue - currentValue) / smoothing

  //// make the fish swing according to the mouse direction
  //  fish.rotation.x += ((-speed.y/50)-fish.rotation.x)/smoothing;
  //  fish.rotation.z += ((-speed.y/50)-fish.rotation.z)/smoothing;
  //  fish.rotation.y += ((-speed.y/50)-fish.rotation.y)/smoothing;

  if (fish) {

    // make the fish move according to the mouse direction
    fish.position.x += ((((mousePos.x - windowHalfX * 2) / 4) - windowHalfX / 2) - fish.position.x) / smoothing;
    fish.position.y += ((-speed.y * 10) - fish.position.y) / smoothing;

    // make the eyes follow the mouse direction
    rightEye.rotation.z = leftEye.rotation.z = -speed.y / 150;
    rightIris.position.x = leftIris.position.y = -10 - speed.y / 2;

    // make it look angry when the speed increases by narrowing the eyes
    rightEye.scale.set(1, 1 - (speed.x / 150), 1);
    leftEye.scale.set(1, 1 - (speed.x / 150), 1);

    // in order to optimize, I precalculate a smaller speed values depending on speed.x
    // these variables will be used to update the wagging of the tail, the color of the fish and the scale of the fish
    var s2 = speed.x / 100; // used for the wagging speed and color 
    var s3 = speed.x / 300; // used for the scale

    // I use an angle that I increment, and then use its cosine and sine to make the tail wag in a cyclic movement. The speed of the wagging depends on the global speed
    angleFin += s2;
    // for a better optimization, precalculate sine and cosines
    var backTailCycle = Math.cos(angleFin);
    var sideFinsCycle = Math.sin(angleFin / 5);

    tailFish.rotation.y = backTailCycle * .5;
    topFish.rotation.x = sideFinsCycle * .5;
    sideRightFish.rotation.x = halfPI + sideFinsCycle * .2;
    sideLeftFish.rotation.x = halfPI + sideFinsCycle * .2;

    // color update depending on the speed
    var rvalue = (fishSlowColor.r + (fishFastColor.r - fishSlowColor.r) * s2) / 255;
    var gvalue = (fishSlowColor.g + (fishFastColor.g - fishSlowColor.g) * s2) / 255;
    var bvalue = (fishSlowColor.b + (fishFastColor.b - fishSlowColor.b) * s2) / 255;
    bodyFish.material.color.setRGB(rvalue, gvalue, bvalue);
    lipsFish.material.color.setRGB(rvalue, gvalue, bvalue);

    //scale update depending on the speed => make the fish struggling to progress
    fish.scale.set(1 + s3, 1 - s3, 1 - s3);
  }
  
  // particles update 
  for (var i = 0; i < flyingParticles.length; i++) {
    var particle = flyingParticles[i];
    particle.rotation.y += (1 / particle.scale.x) * .05;
    particle.rotation.x += (1 / particle.scale.x) * .05;
    particle.rotation.z += (1 / particle.scale.x) * .05;
    particle.position.x += -10 - (1 / particle.scale.x) * speed.x * .2;
    particle.position.y += (1 / particle.scale.x) * speed.y * .2;
    if (particle.position.x < -xLimit - 80) { // check if the particle is out of the field of view
      scene.remove(particle);
      waitingParticles.push(flyingParticles.splice(i, 1)[0]); // recycle the particle
      i--;
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);

}

// Lights
// I use 2 lights, an hemisphere to give a global ambient light
// And a harder light to add some shadows
function createLight() {
  light = new THREE.HemisphereLight(0xffffff, 0xffffff, .3)
  scene.add(light);
  shadowLight = new THREE.DirectionalLight(0xffffff, .8);
  shadowLight.position.set(1, 1, 1);
  scene.add(shadowLight);
}

function createFish() {
  
}


// PARTICLES
function createParticle() {
  var particle, geometryCore, ray, w, h, d, sh, sv;

  // 3 different shapes are used, chosen randomly
  var rnd = Math.random();

  // BOX
  if (rnd < .33) {
    w = 10 + Math.random() * 30;
    h = 10 + Math.random() * 30;
    d = 10 + Math.random() * 30;
    geometryCore = new THREE.BoxGeometry(w, h, d);
  }
  // TETRAHEDRON
  else if (rnd < .66) {
    ray = 10 + Math.random() * 20;
    geometryCore = new THREE.TetrahedronGeometry(ray);
  }
  // SPHERE... but as I also randomly choose the number of horizontal and vertical segments, it sometimes lead to wierd shapes
  else {
    ray = 5 + Math.random() * 30;
    sh = 2 + Math.floor(Math.random() * 2);
    sv = 2 + Math.floor(Math.random() * 2);
    geometryCore = new THREE.SphereGeometry(ray, sh, sv);
  }

  // Choose a color for each particle and create the mesh
  var materialCore = new THREE.MeshLambertMaterial({
    color: getRandomColor(),
    shading: THREE.FlatShading
  });
  particle = new THREE.Mesh(geometryCore, materialCore);
  return particle;
}

// depending if there is particles stored in the waintingParticles array, get one from there or create a new one
function getParticle() {
  if (waitingParticles.length) {
    return waitingParticles.pop();
  } else {
    return createParticle();
  }
}

function flyParticle() {
  var particle = getParticle();
  // set the particle position randomly but keep it out of the field of view, and give it a random scale
  particle.position.x = xLimit;
  particle.position.y = -yLimit + Math.random() * yLimit * 2;
  particle.position.z = Math.random() * maxParticlesZ;
  var s = .1 + Math.random();
  particle.scale.set(s, s, s);
  flyingParticles.push(particle);
  scene.add(particle);
}



function getRandomColor() {
  var col = hexToRgb(colors[Math.floor(Math.random() * colors.length)]);
  var threecol = new THREE.Color("rgb(" + col.r + "," + col.g + "," + col.b + ")");
  return threecol;
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

init();
createLight();
// we don't want the fish on mobile
if (WIDTH > MAX_WIDTH) createFish();
createParticle();
loop();
setInterval(flyParticle, 70); // launch a new particle every 70ms
