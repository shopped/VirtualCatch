const THREE = require('./three.js');
const ballTexture = require('../textures/ball.jpg');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var sphereGeometry = new THREE.SphereGeometry(1, 40, 40);
var texture = new THREE.TextureLoader().load(ballTexture);
var material = new THREE.MeshBasicMaterial({ map: texture });

camera.position.z = 5;

const gravity = 0.0001;
let defaultThrowForce = 0.1;

let balls = [createBall()];

function createBall() {
    const ballMesh = new THREE.Mesh(sphereGeometry, material);
    const ball = { ballMesh };
    ball.vy = Math.random() * .2 - .1;
    ball.vx = Math.random() * .2 - .1;
    ball.rx = Math.random() * .1;
    ball.ry = Math.random() * .1;
    ball.rz = Math.random() * .1;
    ball.throwForce = defaultThrowForce;
    scene.add(ballMesh)
    return ball;
}

document.addEventListener('keydown', (event) => {
    const keyName = event.key;
    if (keyName == 'ArrowUp') {
        console.log(currentSpeedIndex);
        if (currentSpeedIndex < speeds.length - 1) {
            currentSpeedIndex++;
            currentSpeed = speeds[currentSpeedIndex];
            resetBallInterval();
        }
    }

    if (keyName == 'ArrowDown') {
        if (currentSpeedIndex > 0) {
            currentSpeedIndex--;
            currentSpeed = speeds[currentSpeedIndex];
            resetBallInterval();
        }
    }
}, false);

const vvSLOW = 5000;
const vSLOW = 4000;
const SLOW = 3000;
const MED = 1000;
const FAST = 300;
const xFAST = 200;
const xxFAST = 100;
const speeds = [vvSLOW, vSLOW, SLOW, MED, FAST, xFAST, xxFAST];
const textOptions = {
    0: 'very very slow',
    1: 'very slow',
    2: 'slow',
    3: 'normal',
    4: 'fast',
    5: 'very fast',
    6: 'impossibly fast'
}
let currentSpeedIndex = 3;
let currentSpeed = speeds[currentSpeedIndex];
let currentInterval = window.setInterval(() => balls.push(createBall()), currentSpeed);

function resetBallInterval() {
    window.clearInterval(currentInterval);
    currentInterval = window.setInterval(() => balls.push(createBall()), currentSpeed);
    document.getElementById('speed').innerHTML = `Pitcher is ${textOptions[currentSpeedIndex]}`;
}

function animate() {
    // Rendering
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    // Ball Physics
    balls.forEach(b => {
        b.vy += gravity;

        b.ballMesh.position.z -= b.throwForce;
        b.ballMesh.position.y -= b.vy;
        b.ballMesh.position.x -= b.vx;
        b.ballMesh.rotation.x += b.rx;
        b.ballMesh.rotation.y += b.ry;
        // b.ballMesh.rotation.z += b.rz;
    });
}
animate();