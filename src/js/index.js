"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var THREE = require("three");
var posenet = require("@tensorflow-models/posenet");
var ballTexture = require('../textures/ball.jpg');
var glovePNG = require('../glove.png');
var glove = new Image();
glove.src = glovePNG;
var rainbow = [
    [110, 64, 170], [143, 61, 178], [178, 60, 178], [210, 62, 167],
    [238, 67, 149], [255, 78, 125], [255, 94, 99], [255, 115, 75],
    [255, 140, 56], [239, 167, 47], [217, 194, 49], [194, 219, 64],
    [175, 240, 91], [135, 245, 87], [96, 247, 96], [64, 243, 115],
    [40, 234, 141], [28, 219, 169], [26, 199, 194], [33, 176, 213],
    [47, 150, 224], [65, 125, 224], [84, 101, 214], [99, 81, 195]
];
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var sphereGeometry = new THREE.SphereGeometry(1, 40, 40);
var texture = new THREE.TextureLoader().load(ballTexture);
var material = new THREE.MeshBasicMaterial({ map: texture });
camera.position.z = 5;
var gravity = 0.0001;
var defaultThrowForce = 0.2;
var balls = [];
var gameDelay = 5000;
function loading() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    document.getElementById('speed').innerHTML = "Loading Balls";
                    // loadBalls();
                    document.getElementById('speed').innerHTML = "Loading Your Camera";
                    return [4 /*yield*/, loadCamera()];
                case 1:
                    _a.sent();
                    document.getElementById('speed').innerHTML = "Animating initial frame";
                    animate();
                    document.getElementById('speed').innerHTML = "Pitcher is " + textOptions[currentSpeedIndex];
                    window.setTimeout(function () { return startGame(); }, gameDelay);
                    return [2 /*return*/];
            }
        });
    });
}
function startGame() {
    currentInterval = window.setInterval(function () { return balls.push(createBall()); }, currentSpeed);
    // Changing Speeds via Keys
    document.addEventListener('keydown', function (event) {
        var keyName = event.key;
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
    [vectormin, vectormax].forEach(function (v) {
        v.x = Math.round((v.x + 1) * canvas.width / 2);
        v.y = Math.round((-v.y + 1) * canvas.height / 2);
        v.z = 0;
        // mirror logie
        v.x = canvas.width - v.x;
    });
    // console.log(vectormin, vectormax);
    return [vectormin, vectormax];
}
var state = {
    video: null,
    stream: null,
    net: null
};
function setUpCamera() {
    return __awaiter(this, void 0, void 0, function () {
        var videoElement, stream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    videoElement = document.getElementById('video');
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                        alert('Error getting access to your webcam webcam.');
                    }
                    return [4 /*yield*/, navigator.mediaDevices.getUserMedia({ 'audio': false, 'video': { width: window.innerWidth, height: window.innerHeight } })];
                case 1:
                    stream = _a.sent();
                    videoElement.srcObject = stream;
                    return [2 /*return*/, new Promise(function (resolve) {
                            videoElement.onloadedmetadata = function () {
                                videoElement.width = window.innerWidth;
                                videoElement.height = window.innerHeight;
                                resolve(videoElement);
                            };
                        })];
            }
        });
    });
}
var mobileNetArchitecture = 0.75; // 0.5, 0.75, 1, ?1.01
function loadCamera() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, e_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = state;
                    return [4 /*yield*/, posenet.load(mobileNetArchitecture)];
                case 1:
                    _a.net = _c.sent();
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    _b = state;
                    return [4 /*yield*/, setUpCamera()];
                case 3:
                    _b.video = _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _c.sent();
                    console.log("Error! Getting video", e_1, e_1.message);
                    document.getElementById('speed').innerHTML = 'Error getting video!';
                    return [3 /*break*/, 5];
                case 5:
                    state.video.play();
                    return [2 /*return*/];
            }
        });
    });
}
function createBall() {
    var ballMesh = new THREE.Mesh(sphereGeometry, material);
    var ball = { ballMesh: ballMesh };
    ball.vy = Math.random() * .2 - .1;
    ball.vx = Math.random() * .2 - .1;
    ball.rx = Math.random() * .1;
    ball.ry = Math.random() * .1;
    ball.rz = Math.random() * .1;
    ball.throwForce = defaultThrowForce;
    scene.add(ballMesh);
    return ball;
}
var vvSLOW = 6000;
var vSLOW = 5000;
var SLOW = 4000;
var MED = 1500;
var FAST = 500;
var xFAST = 300;
var xxFAST = 150;
var speeds = [vvSLOW, vSLOW, SLOW, MED, FAST, xFAST, xxFAST];
var textOptions = {
    0: 'very very slow',
    1: 'very slow',
    2: 'slow',
    3: 'normal',
    4: 'fast',
    5: 'very fast',
    6: 'impossibly fast'
};
var currentSpeedIndex = 3;
var currentSpeed = speeds[currentSpeedIndex];
var currentInterval = null;
function resetBallInterval() {
    window.clearInterval(currentInterval);
    currentInterval = window.setInterval(function () { return balls.push(createBall()); }, currentSpeed);
    document.getElementById('speed').innerHTML = "Pitcher is " + textOptions[currentSpeedIndex];
}
var canvas = document.getElementById('canvas');
var outputStride = 16; //8, 16, 32
var segmentationThreshold = 0.5;
var flipHorizontally = true;
var personSegmentation;
document.getElementById('video').style.width = window.innerWidth;
document.getElementById('video').style.height = window.innerHeight;
document.getElementById('canvas').style.width = window.innerWidth;
document.getElementById('canvas').width = window.innerWidth;
document.getElementById('canvas').style.height = window.innerHeight;
document.getElementById('canvas').height = window.innerHeight;
var flipped = false;
function animate() {
    return __awaiter(this, void 0, void 0, function () {
        var ctx, theflash, pose, handBBl, handBBr, distanceConstant;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ctx = canvas.getContext('2d');
                    if (!flipped) {
                        ctx.translate(window.innerWidth, 0);
                        ctx.scale(-1, 1);
                        flipped = true;
                    }
                    theflash = document.getElementById('theflash');
                    return [4 /*yield*/, state.net.estimateSinglePose(state.video, 0.5, false, outputStride)];
                case 1:
                    pose = _a.sent();
                    handBBl = null;
                    handBBr = null;
                    if (pose) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        distanceConstant = 2 * Math.max(distance(pose.keypoints[0], pose.keypoints[1]), distance(pose.keypoints[0], pose.keypoints[2]));
                        ctx.drawImage(video, 0, 0, window.innerWidth, window.innerHeight);
                        if (pose.keypoints[9].confidence < .5) {
                            handBBl = null;
                        }
                        else {
                            handBBl = { min: { x: pose.keypoints[9].position.x - (distanceConstant / 2), y: pose.keypoints[9].position.y - (distanceConstant / 2) }, max: { x: pose.keypoints[9].position.x + (distanceConstant / 2), y: pose.keypoints[9].position.y + (distanceConstant / 2) } };
                            ctx.drawImage(glove, pose.keypoints[9].position.x - distanceConstant, pose.keypoints[9].position.y - distanceConstant, distanceConstant * 2, distanceConstant * 2);
                        }
                        if (pose.keypoints[10].confidence < .5) {
                            handBBr = null;
                        }
                        else {
                            handBBr = { min: { x: pose.keypoints[10].position.x - (distanceConstant / 2), y: pose.keypoints[10].position.y - (distanceConstant / 2) }, max: { x: pose.keypoints[10].position.x + (distanceConstant / 2), y: pose.keypoints[10].position.y + (distanceConstant / 2) } };
                            ctx.drawImage(glove, pose.keypoints[10].position.x - distanceConstant, pose.keypoints[10].position.y - distanceConstant, distanceConstant * 2, distanceConstant * 2);
                        }
                    }
                    // Ball Physics
                    balls.forEach(function (b, index) {
                        b.vy += gravity;
                        b.ballMesh.position.z -= b.throwForce;
                        b.ballMesh.position.y -= b.vy;
                        b.ballMesh.position.x -= b.vx;
                        b.ballMesh.rotation.x += b.rx;
                        b.ballMesh.rotation.y += b.ry;
                        if (b.ballMesh.position.z < -20) {
                            theflash.className = '';
                            void theflash.offsetWidth;
                            if ((handBBl && detectCollision(getBoundingBox(b.ballMesh), handBBl))
                                ||
                                    (handBBr && detectCollision(getBoundingBox(b.ballMesh), handBBr))) {
                                points++;
                                document.getElementById('score').innerHTML = points;
                                if (currentSpeedIndex < 4) {
                                    theflash.className = 'good';
                                }
                            }
                            else {
                                points--;
                                document.getElementById('score').innerHTML = points;
                                if (currentSpeedIndex < 4) {
                                    theflash.className = 'bad';
                                }
                            }
                            scene.remove(b.ballMesh);
                            balls.splice(index, 1);
                        }
                        // b.ballMesh.rotation.z += b.rz;
                    });
                    renderer.render(scene, camera);
                    requestAnimationFrame(animate);
                    return [2 /*return*/];
            }
        });
    });
}
var points = 0;
function detectCollision(a, b) {
    console.log(a[0], a[1], b);
    if ((a[0].x > b.min.x && a[0].x < b.max.x)
        &&
            (a[0].y > b.min.y && a[0].y < b.max.y)) {
        return true;
    }
    if ((a[1].x > b.min.x && a[1].x < b.max.x)
        &&
            (a[1].y > b.min.y && a[1].y < b.max.y)) {
        return true;
    }
    if ((a[0].x > b.min.x && a[0].x < b.max.x)
        &&
            (a[1].y > b.min.y && a[1].y < b.max.y)) {
        return true;
    }
    if ((a[1].x > b.min.x && a[1].x < b.max.x)
        &&
            (a[0].y > b.min.y && a[0].y < b.max.y)) {
        return true;
    }
    return false;
}
function distance(k1, k2) {
    return Math.sqrt(Math.pow(k1.position.x - k2.position.x, 2) + Math.pow(k1.position.y - k2.position.y, 2));
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
