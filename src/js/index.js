import * as THREE from 'three'
import * as posenet from '@tensorflow-models/posenet';
const ballTexture = require('../textures/ball.jpg');
const glove = require('../glove.png');


const rainbow = [
    [110, 64, 170], [143, 61, 178], [178, 60, 178], [210, 62, 167],
    [238, 67, 149], [255, 78, 125], [255, 94, 99], [255, 115, 75],
    [255, 140, 56], [239, 167, 47], [217, 194, 49], [194, 219, 64],
    [175, 240, 91], [135, 245, 87], [96, 247, 96], [64, 243, 115],
    [40, 234, 141], [28, 219, 169], [26, 199, 194], [33, 176, 213],
    [47, 150, 224], [65, 125, 224], [84, 101, 214], [99, 81, 195]
];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 0);
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
    // startGame();
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

function getBoundingBox(obj) {
    var bbox = new THREE.Box3().setFromObject(obj);
    var vectormin = new THREE.Vector3();
    var vectormax = new THREE.Vector3();
    var canvas = renderer.domElement;

    vectormin.set(bbox.min.x, bbox.min.y, bbox.min.z);
    vectormax.set(bbox.max.x, bbox.max.y, bbox.max.z);
    // map to normalized device coordinate (NDC) space
    vectormin.project(camera);
    vectormax.project(camera);

    // map to 2D screen space
    [vectormin, vectormax].forEach(v => {
        v.x = Math.round((v.x + 1) * canvas.width / 2);
        v.y = Math.round((- v.y + 1) * canvas.height / 2);
        v.z = 0;
    })

    console.log(vectormin, vectormax);
    return [vectormin, vectormax];
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
const outputStride = 16; //8, 16, 32
const segmentationThreshold = 0.5;
const flipHorizontally = true;
var personSegmentation;

async function animate() {
    // Rendering
    requestAnimationFrame(animate);
    // const WebGLCanvas = Array.from(document.getElementsByTagName('canvas')).filter(c => c.id != 'canvas')[0];
    const ctx = canvas.getContext('2d');
    // ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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

        getBoundingBox(b.ballMesh);
        // b.ballMesh.rotation.z += b.rz;
    });

    // const partSegmentation = await state.net.estimatePartSegmentation(state.video, outputStride, segmentationThreshold);
    // const coloredPartImageData = bodyPix.toColoredPartImageData(
    //     partSegmentation,
    //     rainbow);
    // bodyPix.drawPixelatedMask(
    //     canvas, state.video, coloredPartImageData, 0.9,
    //     0, flipHorizontally, 3);
    // console.log(partSegmentation);

    // const personSegmentation = await state.net.estimatePersonSegmentation(
    //     state.video, outputStride,
    //     segmentationThreshold);
    // const mask = bodyPix.toMaskImageData(
    //     personSegmentation, false);
    // bodyPix.drawMask(
    //     canvas, state.video, mask, 0.5,
    //     0.3, flipHorizontally);
}

loading();