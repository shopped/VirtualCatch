import * as THREE from 'three'
import * as bodyPix from '@tensorflow-models/body-pix';
const ballTexture = require('../textures/ball.jpg');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor( 0x000000, 0 );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var sphereGeometry = new THREE.SphereGeometry(1, 40, 40);
var texture = new THREE.TextureLoader().load(ballTexture);
var material = new THREE.MeshBasicMaterial({ map: texture });
camera.position.z = 5;

const gravity = 0.0001;
const defaultThrowForce = 0.1;
const balls = [];

async function loading() {
    document.getElementById('speed').innerHTML = `Loading Balls`;
    loadBalls();
    document.getElementById('speed').innerHTML = `Loading Your Camera`;
    await loadCamera();
    document.getElementById('speed').innerHTML = `Animating initial frame`;
    animate();
    document.getElementById('speed').innerHTML = `Pitcher is ${textOptions[currentSpeedIndex]}`;
    startGame();
}

function startGame() {
    currentInterval = window.setInterval(() => balls.push(createBall()), currentSpeed);
    // Changing Speeds via Keys
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
}

function loadBalls() {
    balls.push(createBall());
}

const state = {
    video: null,
    stream: null,
    net: null
}

async function setUpCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Error getting access to your webcam webcam.');
    }

    const videoElement = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia(
        { 'audio': false, 'video': true });
    videoElement.srcObject = stream;

    return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            videoElement.width = videoElement.videoWidth;
            videoElement.height = videoElement.videoHeight;
            resolve(videoElement);
        }
    })
}

const mobileNetArchitecture = 0.75; // 0.5, 0.75, 1, ?1.01
async function loadCamera() {
    state.net = await bodyPix.load(mobileNetArchitecture);
    try {
        state.video = await setUpCamera();
    } catch (e) {
        console.log("Error! Getting video", e)
        document.getElementById('speed').innerHTML = 'Error getting video!';
    }
    state.video.play();
    personSegmentation = await state.net.estimatePersonSegmentation(state.video, outputStride, segmentationThreshold);
}

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
let currentInterval = null;

function resetBallInterval() {
    window.clearInterval(currentInterval);
    currentInterval = window.setInterval(() => balls.push(createBall()), currentSpeed);
    document.getElementById('speed').innerHTML = `Pitcher is ${textOptions[currentSpeedIndex]}`;
}

const canvas = document.getElementById('canvas');
console.log(canvas);
const outputStride = 16; //8, 16, 32
const segmentationThreshold = 0.5;
const flipHorizontally = true;
var personSegmentation;

async function animate() {
    // Rendering
    requestAnimationFrame(animate);
    const ctx = canvas.getContext('2d');
    console.log(canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    renderer.render(scene, camera);

    // Ball Physics
    balls.forEach(b => {
        b.vy += gravity;

        b.ballMesh.position.z -= b.throwForce;
        b.ballMesh.position.y -= b.vy;
        b.ballMesh.position.x -= b.vx;
        b.ballMesh.rotation.x += b.rx;
        b.ballMesh.rotation.y += b.ry;

        if (b.ballMesh.position.z < -50) {
            scene.remove(b.ballMesh);
        }
        // b.ballMesh.rotation.z += b.rz;
    });

    // const partSegmentation = await state.net.estimatePartSegmentation(state.video, outputStride, segmentationThreshold);
    // console.log(partSegmentation);
}

loading();