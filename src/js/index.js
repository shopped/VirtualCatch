const THREE = require('./three.js');
const ballTexture = require('../textures/ball.jpg');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var sphereGeometry = new THREE.SphereGeometry(1, 30, 30);

// var cubeGeometry = new THREE.CubeGeometry( 1, 1, 1 );

// Setting the ball texture
var texture = new THREE.TextureLoader().load(ballTexture);
// texture.wrapS = THREE.RepeatWrapping;
// texture.wrapT = THREE.RepeatWrapping;
// texture.repeat.set( 4, 4 );

var material = new THREE.MeshBasicMaterial( { map: texture } );
var obj = new THREE.Mesh( sphereGeometry, material );

scene.add( obj );

camera.position.z = 5;

let gravity = 0.0001;
let throwForce = 0.1;
let vy = 0;

function animate() {
    // Rendering
	requestAnimationFrame( animate );
    renderer.render( scene, camera );

    // Gravitational Physics
    vy += gravity;

    // Other forces
    obj.position.z -= throwForce;
    obj.position.y -= vy;
    obj.rotation.x += 0.1;
    obj.rotation.y += 0.1;
}
animate();