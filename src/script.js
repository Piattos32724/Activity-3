import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Debug GUI
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Loaders
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// Clock
const clock = new THREE.Clock();

// Raycaster for future interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Helper function to convert hex color to normalized RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return [r, g, b];
}

// Array of lava-like hex colors
const lavaColors = [
    '#FF4500', // Bright Orange
    '#FF2400', // Molten Red
    '#FFD700', // Glowing Yellow
    '#8B0000', // Dark Red
    '#FF6347', // Fiery Red-Orange
];

// Fountain base for particle system
const fountainBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 1, 32),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 }) // Brown base
);
fountainBase.position.set(0, 0, 0);
scene.add(fountainBase);

// Particles
const particleCount = 1000;
const particleGeometry = new THREE.SphereGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3); // Array for RGB colors

for (let i = 0; i < particleCount; i++) {
    // Initialize positions
    positions[i * 3] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 1] = fountainBase.position.y + 0.5; // Above the base
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

    // Initialize velocities
    velocities[i * 3] = (Math.random() - 0.5) * 0.2;
    velocities[i * 3 + 1] = Math.random() * 0.8 + 0.5;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

    // Randomize colors
    const randomColor = lavaColors[Math.floor(Math.random() * lavaColors.length)];
    const [r, g, b] = hexToRgb(randomColor);

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Assign colors to geometry

// Particle Material with vertex colors enabled
const particleMaterial = new THREE.PointsMaterial({
    size: 1,
    vertexColors: true, // Enable vertex colors
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
});

const fountainParticles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(fountainParticles);

// Animate particles
function animateFountainParticles() {
    const positions = fountainParticles.geometry.attributes.position.array;
    const velocities = fountainParticles.geometry.attributes.velocity.array;

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];

        velocities[i * 3 + 1] -= 0.01; // Gravity effect

        if (positions[i * 3 + 1] < fountainBase.position.y) {
            positions[i * 3] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 1] = fountainBase.position.y + 0.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

            velocities[i * 3] = (Math.random() - 0.5) * 0.2;
            velocities[i * 3 + 1] = Math.random() * 0.8 + 0.5;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }
    }

    fountainParticles.geometry.attributes.position.needsUpdate = true;
}

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const light = new THREE.PointLight(0xffd700, 1, 100);
light.position.set(5, 10, 5);
scene.add(light);

// Directional light
const sunLight = new THREE.DirectionalLight('#ffffff', 0.5)
sunLight.position.set(4, 5, - 2)
gui.add(sunLight, 'intensity').min(0).max(1).step(0.001)
gui.add(sunLight.position, 'x').min(- 5).max(5).step(0.001)
gui.add(sunLight.position, 'y').min(- 5).max(5).step(0.001)
gui.add(sunLight.position, 'z').min(- 5).max(5).step(0.001)
scene.add(sunLight)

// Load volcano model
gltfLoader.load('/the_volcano.glb', (gltf) => {
    const volcano = gltf.scene;
    volcano.scale.set(0.7, 0.7, 0.7);
    volcano.position.set(5, 2, 0);
    scene.add(volcano);
});

// Camera
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 10, 20);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Resize handling
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
function tick() {
    const elapsedTime = clock.getElapsedTime();

    // Animate particles
    animateFountainParticles();

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    requestAnimationFrame(tick);
}

tick();
