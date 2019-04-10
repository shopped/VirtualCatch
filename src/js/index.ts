import * as THREE from 'three'
import * as posenet from '@tensorflow-models/posenet';

const ballTexture = require('../ball.jpg');
const glovePNG = require('../glove.png');
const glove = new Image();
glove.src = glovePNG;

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
const gameDelay = 5000;

async function loading() {
    document.getElementById('speed').innerHTML = `Loading Your Camera`;
    await loadCamera();
    document.getElementById('speed').innerHTML = `Animating initial frame`;
    animate();
    document.getElementById('speed').innerHTML = `Pitcher is ${textOptions[currentSpeedIndex]}`;
    window.setTimeout(() => startGame(), gameDelay);
}

function startGame(): void {
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

function loadBalls(): void {
    balls.push(createBall());
}

function getBoundingBox(obj): object[] {
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
        // mirror logic
        v.x = canvas.width - v.x;
    })
    return [vectormin, vectormax];
}

const state = {
    video: null,
    stream: null,
    net: null
}

async function setUpCamera() {
    const videoElement = <HTMLVideoElement> document.getElementById('video');
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
        console.log("Error! Getting video", e, e.message)
        document.getElementById('speed').innerHTML = 'Error getting video!';
    }
    state.video.play();
    // personSegmentation = await state.net.estimatePersonSegmentation(state.video, outputStride, segmentationThreshold);
}

interface Ball {
    ballMesh: THREE.Mesh,
    vy: number,
    vx: number,
    rx: number,
    ry: number,
    rz: number,
    throwForce: number
}

function createBall(): Ball {
    const ballMesh = new THREE.Mesh(sphereGeometry, material);
    const ball: Ball = { 
        ballMesh,
        vy: Math.random() * .2 - .1,
        vx: Math.random() * .2 - .1,
        rx: Math.random() * .1,
        ry: Math.random() * .1,
        rz: Math.random() * .1,
        throwForce: defaultThrowForce,
     };
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

function resetBallInterval(): void {
    window.clearInterval(currentInterval);
    currentInterval = window.setInterval(() => balls.push(createBall()), currentSpeed);
    document.getElementById('speed').innerHTML = `Pitcher is ${textOptions[currentSpeedIndex]}`;
}

const canvas = <HTMLCanvasElement> document.getElementById('canvas');
const outputStride = 16; //8, 16, 32

document.getElementById('video').style.width = window.innerWidth.toString();
document.getElementById('video').style.height = window.innerHeight.toString();
document.getElementById('canvas').style.width = window.innerWidth.toString();
// @ts-ignore
document.getElementById('canvas').width = window.innerWidth.toString();
document.getElementById('canvas').style.height = window.innerHeight.toString();
// @ts-ignore
document.getElementById('canvas').height = window.innerHeight.toString();

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

    const pose = await state.net.estimateSinglePose(state.video, 0.5, false, outputStride);
    var handBBl = null;
    var handBBr = null;
    if (pose) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const distanceConstant = 2 * Math.max(distance(pose.keypoints[0], pose.keypoints[1]), distance(pose.keypoints[0], pose.keypoints[2]));
        // @ts-ignore
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
                document.getElementById('score').innerHTML = points.toString();
                if (currentSpeedIndex < 4) {
                    theflash.className = 'good';
                }
            } else {
                points--;
                document.getElementById('score').innerHTML = points.toString();
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

function detectCollision(a, b): boolean {
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

function distance(k1, k2): number {
    return Math.sqrt(Math.pow(k1.position.x - k2.position.x, 2) + Math.pow(k1.position.y - k2.position.y, 2))
}

function toggleFullScreen(): void {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl['mozRequestFullScreen'] || docEl['webkitRequestFullScreen'] || docEl['msRequestFullscreen'];
    var cancelFullScreen = doc.exitFullscreen || doc['mozCancelFullScreen'] || doc['webkitExitFullscreen'] || doc['msExitFullscreen'];

    if (!doc['fullscreenElement'] && !doc['mozFullScreenElement'] && !doc['webkitFullscreenElement'] && !doc['msFullscreenElement']) {
        requestFullScreen.call(docEl);
    }
    else {
        cancelFullScreen.call(doc);
    }
}

loading();