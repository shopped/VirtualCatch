import * as THREE from 'three'
import * as posenet from '@tensorflow-models/posenet';
const ballTexture = require('../textures/ball.jpg');
const glovePNG = require('../glove.png');
const glove = new Image();
glove.src = glovePNG;

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
const defaultThrowForce = 0.2;
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

        if (keyName == 'ArrowRight') {
            toggleFullScreen();
        }

        if (keyName == 'ArrowLeft') {
            toggleFullScreen();
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

        // mirror logie
        v.x = canvas.width - v.x;
    })

    // console.log(vectormin, vectormax);
    return [vectormin, vectormax];
}

const state = {
    video: null,
    stream: null,
    net: null
}

async function setUpCamera() {
    const videoElement = document.getElementById('video');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Error getting access to your webcam webcam.');
    }

    const stream = await navigator.mediaDevices.getUserMedia(
        { 'audio': false, 'video': { width: window.innerWidth, height: window.innerHeight } });
    videoElement.srcObject = stream;

    return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            videoElement.width = window.innerWidth;
            videoElement.height = window.innerHeight;
            resolve(videoElement);
        }
    })
}

const mobileNetArchitecture = 0.75; // 0.5, 0.75, 1, ?1.01
async function loadCamera() {
    state.net = await posenet.load(mobileNetArchitecture);
    try {
        state.video = await setUpCamera();
    } catch (e) {
        console.log("Error! Getting video", e)
        document.getElementById('speed').innerHTML = 'Error getting video!';
    }
    state.video.play();
    // personSegmentation = await state.net.estimatePersonSegmentation(state.video, outputStride, segmentationThreshold);
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

const vvSLOW = 6000;
const vSLOW = 5000;
const SLOW = 4000;
const MED = 1500;
const FAST = 500;
const xFAST = 300;
const xxFAST = 150;
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

document.getElementById('video').style.width = window.innerWidth;
document.getElementById('video').style.height = window.innerHeight;
document.getElementById('canvas').style.width = window.innerWidth;
document.getElementById('canvas').width = window.innerWidth;
document.getElementById('canvas').style.height = window.innerHeight;
document.getElementById('canvas').height = window.innerHeight;

let flipped = false;

async function animate() {
    // Rendering
    const ctx = canvas.getContext('2d');
    if (!flipped) {
        ctx.translate(window.innerWidth, 0);
        ctx.scale(-1, 1);
        flipped = true;
    }
    const theflash = document.getElementById('theflash');
    // const vid = document.getElementById('video');
    // ctx.save();
    // ctx.scale(-1, 1);
    // ctx.translate(-window.innerWidth, 0);
    // ctx.restore();


    const pose = await state.net.estimateSinglePose(state.video, 0.5, false, outputStride);
    var handBBl = null;
    var handBBr = null;
    if (pose) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const distanceConstant = 2 * Math.max(distance(pose.keypoints[0], pose.keypoints[1]), distance(pose.keypoints[0], pose.keypoints[2]));
        ctx.drawImage(video, 0, 0, window.innerWidth, window.innerHeight);
        if (pose.keypoints[9].confidence < .5) {
            handBBl = null;
        } else {
            handBBl = { min: { x: pose.keypoints[9].position.x - (distanceConstant / 2), y: pose.keypoints[9].position.y - (distanceConstant / 2) }, max: { x: pose.keypoints[9].position.x + (distanceConstant / 2), y: pose.keypoints[9].position.y + (distanceConstant / 2) } };
            ctx.drawImage(glove, pose.keypoints[9].position.x - distanceConstant, pose.keypoints[9].position.y - distanceConstant, distanceConstant * 2, distanceConstant * 2);
        }
        if (pose.keypoints[10].confidence < .5) {
            handBBr = null;
        } else {
            handBBr = { min: { x: pose.keypoints[10].position.x - (distanceConstant / 2), y: pose.keypoints[10].position.y - (distanceConstant / 2) }, max: { x: pose.keypoints[10].position.x + (distanceConstant / 2), y: pose.keypoints[10].position.y + (distanceConstant / 2) } };
            ctx.drawImage(glove, pose.keypoints[10].position.x - distanceConstant, pose.keypoints[10].position.y - distanceConstant, distanceConstant * 2, distanceConstant * 2);
        }
    }

    // Ball Physics
    balls.forEach((b, index) => {
        b.vy += gravity;

        b.ballMesh.position.z -= b.throwForce;
        b.ballMesh.position.y -= b.vy;
        b.ballMesh.position.x -= b.vx;
        b.ballMesh.rotation.x += b.rx;
        b.ballMesh.rotation.y += b.ry;

        if (b.ballMesh.position.z < -20) {
            theflash.className = '';
            void theflash.offsetWidth;
            if (
                (handBBl && detectCollision(getBoundingBox(b.ballMesh), handBBl))
                ||
                (handBBr && detectCollision(getBoundingBox(b.ballMesh), handBBr))
            ) {
                points++;
                document.getElementById('score').innerHTML = points;
                if (currentSpeedIndex < 4) {
                    theflash.className = 'good';
                }
            } else {
                points--;
                document.getElementById('score').innerHTML = points;
                if (currentSpeedIndex < 4) {
                    theflash.className = 'bad';
                }
            }
            scene.remove(b.ballMesh);
            balls.splice(index, 1)
        }

        // b.ballMesh.rotation.z += b.rz;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

var points = 0;

function detectCollision(a, b) {
    console.log(a[0], a[1], b);
    if (
        (a[0].x > b.min.x && a[0].x < b.max.x)
        &&
        (a[0].y > b.min.y && a[0].y < b.max.y)
    ) {
        return true;
    }
    if (
        (a[1].x > b.min.x && a[1].x < b.max.x)
        &&
        (a[1].y > b.min.y && a[1].y < b.max.y)
    ) {
        return true;
    }
    if (
        (a[0].x > b.min.x && a[0].x < b.max.x)
        &&
        (a[1].y > b.min.y && a[1].y < b.max.y)
    ) {
        return true;
    }
    if (
        (a[1].x > b.min.x && a[1].x < b.max.x)
        &&
        (a[0].y > b.min.y && a[0].y < b.max.y)
    ) {
        return true;
    }
    return false;
}

function distance(k1, k2) {
    return Math.sqrt(Math.pow(k1.position.x - k2.position.x, 2) + Math.pow(k1.position.y - k2.position.y, 2))
}

function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;
  
    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
  
    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
      requestFullScreen.call(docEl);
    }
    else {
      cancelFullScreen.call(doc);
    }
  }

loading();