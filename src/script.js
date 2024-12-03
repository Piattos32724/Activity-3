import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()

const sunGeometry = new THREE.SphereGeometry(5, 32, 32); 
const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700, 
    emissive: 0xffd700, 
    emissiveIntensity: 0.8, 
});

const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(5, 50, 0); 
scene.add(sun);



const waterTexture = textureLoader.load('/sea.png');

const waterGeometry = new THREE.PlaneGeometry(50, 50, 50, 50); 
const waterMaterial = new THREE.MeshStandardMaterial({
    map: waterTexture,
    transparent: true,
    opacity: 0.5,
    color: 0x00aaff,
    roughness: 0.5
});

// Create water mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI * 0.5;
water.position.set(0, 1, 10); // Position the water
scene.add(water);

// Clock for time tracking
const Wclock = new THREE.Clock();

// Animate the water surface
function animateWaves() {
    const time = Wclock.getElapsedTime();

    // Access the water geometry vertices
    const vertices = waterGeometry.attributes.position.array;
    const waveAmplitude = 0.5; // Height of the wave
    const waveFrequency = 1.5; // Frequency of the wave

    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];

        // Apply sine wave formula to z-axis
        vertices[i + 2] = waveAmplitude * Math.sin(x * waveFrequency + time) + 
                          waveAmplitude * Math.sin(y * waveFrequency + time * 0.5);
    }

    // Mark the position attribute as needing an update
    waterGeometry.attributes.position.needsUpdate = true;

    // Request the next frame
    requestAnimationFrame(animateWaves);
}

const lowerWater = water.clone();
lowerWater.position.y -= 0.2; // Slightly below the first layer
scene.add(lowerWater);

// Animate both layers
function animateDoubleLayerWaves() {
    const time = clock.getElapsedTime();

    const verticesTop = waterGeometry.attributes.position.array;
    const verticesBottom = lowerWater.geometry.attributes.position.array;

    const waveAmplitude = 0.7;
    const waveFrequency = 1.5;

    for (let i = 0; i < verticesTop.length; i += 3) {
        const x = verticesTop[i];
        const y = verticesTop[i + 1];

        verticesTop[i + 2] = waveAmplitude * Math.sin(x * waveFrequency + time) +
                             waveAmplitude * Math.sin(y * waveFrequency + time * 0.5);

        verticesBottom[i + 2] = waveAmplitude * Math.sin(x * waveFrequency + time) +
                                waveAmplitude * Math.sin(y * waveFrequency + time * 0.5);
    }

    waterGeometry.attributes.position.needsUpdate = true;
    lowerWater.geometry.attributes.position.needsUpdate = true;

    requestAnimationFrame(animateDoubleLayerWaves);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Add event listener for mouse move
window.addEventListener('mousemove', onMouseMove);

function onMouseMove(event) {
    // Normalize mouse coordinates (-1 to +1 range)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Clock for animation
const clockR = new THREE.Clock();

function animateWavesWithInteraction() {
    const time = clockR.getElapsedTime();

    // Access the water geometry vertices
    const vertices = waterGeometry.attributes.position.array;
    const waveAmplitude = 0.8;
    const waveFrequency = 1.5;

    // Update waves as usual
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];

        vertices[i + 2] = waveAmplitude * Math.sin(x * waveFrequency + time) +
                          waveAmplitude * Math.sin(y * waveFrequency + time * 0.5);
    }

    // Update wave geometry with mouse interaction
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(water);

    if (intersects.length > 0) {
        const point = intersects[0].point;

        // Enhance wave effect near mouse intersection
        for (let i = 0; i < vertices.length; i += 3) {
            const dx = vertices[i] - point.x;
            const dy = vertices[i + 1] - point.z;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Apply a ripple effect based on mouse position
            if (distance < 1) {
                vertices[i + 2] += Math.sin(time * 5) * 0.3 * (1 - distance);
            }
        }
    }

    // Update geometry
    waterGeometry.attributes.position.needsUpdate = true;

    // Request next frame
    requestAnimationFrame(animateWavesWithInteraction);
}



// Particle Geometry
const particleGeometry = new THREE.BufferGeometry();
const particleCount = 10000; // Number of particles

// Arrays for positions and velocities
const positions = new Float32Array(particleCount * 3); // x, y, z for each particle
const velocities = new Float32Array(particleCount * 3); // velocity (x, y, z) for each particle

for (let i = 0; i < particleCount; i++) {
    // Initialize positions near the fountain's base
    positions[i * 3] = (Math.random() - 0.5) * 2; // Random X position
    positions[i * 3 + 1] = 0;                     // Start Y position (base of the fountain)
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2; // Random Z position

    // Initialize random velocities for the particles
    velocities[i * 3] = (Math.random() - 0.5) * 0.2; // X velocity for spreading
    velocities[i * 3 + 1] = Math.random() * 0.8 + 0.5; // Y velocity (upwards)
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2; // Z velocity for spreading
}

// Assign positions and velocities to the geometry
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

// Particle Material
const particleMaterial = new THREE.PointsMaterial({
    size: 0.1, // Size of each particle
    color: 0x00aaff, // Blue color for water
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

// Particle Points
const fountainParticles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(fountainParticles);

// Fountain Base (Optional)
const fountainBaseGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 32);
const fountainBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const fountainBase = new THREE.Mesh(fountainBaseGeometry, fountainBaseMaterial);
// Fountain Base Position
const fountainBaseHeight = 1.5; // Height of the fountain base above the sand
fountainBase.position.set(0, fountainBaseHeight, 0); // Fountain base's position

// Adjust Fountain Particles Initialization
for (let i = 0; i < particleCount; i++) {
    // Set the starting positions relative to the fountain base
    positions[i * 3] = (Math.random() - 0.5) * 2; // Random X position near the fountain
    positions[i * 3 + 1] = fountainBaseHeight;    // Start Y position (top of the fountain base)
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2; // Random Z position near the fountain

    // Set initial velocities
    velocities[i * 3] = (Math.random() - 0.5) * 0.2; // X velocity
    velocities[i * 3 + 1] = Math.random() * 0.8 + 0.5; // Y velocity (upwards)
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2; // Z velocity
}

// Animate Particles
function animateFountainParticles() {
    const positions = fountainParticles.geometry.attributes.position.array;
    const velocities = fountainParticles.geometry.attributes.velocity.array;

    for (let i = 0; i < particleCount; i++) {
        // Update positions
        positions[i * 3] += velocities[i * 3];       // X movement
        positions[i * 3 + 1] += velocities[i * 3 + 1]; // Y movement (upwards/downwards)
        positions[i * 3 + 2] += velocities[i * 3 + 2]; // Z movement

        // Apply gravity (reduce Y velocity over time)
        velocities[i * 3 + 1] -= 0.01; // Pull particles down (gravity)

        // Reset particles when they fall below the fountain base
        if (positions[i * 3 + 1] < fountainBase.position.y) { // Dynamic base position check
            positions[i * 3] = (Math.random() - 0.5) * 2 + fountainBase.position.x; // Reset X near fountain
            positions[i * 3 + 1] = fountainBase.position.y;                         // Reset Y to the fountain base
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2 + fountainBase.position.z; // Reset Z near fountain

            velocities[i * 3] = (Math.random() - 0.5) * 0.2; // Reset X velocity
            velocities[i * 3 + 1] = Math.random() * 0.8 + 0.5; // Reset Y velocity
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2; // Reset Z velocity
        }
    }

    fountainParticles.geometry.attributes.position.needsUpdate = true; // Notify Three.js to update positions
}
fountainBase.position.z = -30
scene.add(fountainBase)

const sandTexture = textureLoader.load('/sand.jpg')
sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping
const sandTextureAO = textureLoader.load('/sandAO.jpg')
sandTextureAO.wrapS = sandTextureAO.wrapT = THREE.RepeatWrapping

const sandGround = new THREE.BoxGeometry(50, 50, 3)
const sandMaterial = new THREE.MeshStandardMaterial({
    map: sandTexture,
    aoMap: sandTextureAO,
    roughness: 1
})

const sand = new THREE.Mesh(sandGround, sandMaterial)

sand.rotation.x = -Math.PI * 0.5
sand.position.z = -40
//sand.receiveShadow = true; 

scene.add(sand)

gltfLoader.load(
    '/the_volcano.glb',
    (gltf) => {
        const sandcastle = gltf.scene; // Extract the scene from the loaded GLTF
        
        // Set scale and position
        sandcastle.scale.set(0.9, 0.9, 0.9);
        sandcastle.position.set(10, 2, -30);

        // Add the sandcastle to the scene
        scene.add(sandcastle);
    }
)

gltfLoader.load(
    '/white_plastic_chair.glb',
    (gltf) => {
        const chair = gltf.scene; // Extract the scene from the loaded GLTF
        
        // Set scale and position
        chair.scale.set(5, 5, 5);
        chair.position.set(-15, 1.5, -45);

        // Add the sandcastle to the scene
        scene.add(chair);
    }
);
gltfLoader.load(
    '/white_plastic_chair.glb',
    (gltf) => {
        const chair1 = gltf.scene; // Extract the scene from the loaded GLTF
        
        // Set scale and position
        chair1.scale.set(5, 5, 5);
        chair1.position.set(-11, 1.5, -45);

        // Add the sandcastle to the scene
        scene.add(chair1);
    }
)



const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
scene.add(ambientLight)

const BsunLight = new THREE.PointLight(0xffd700, 0.9, 300);
BsunLight.position.set(5, 50, 0); 
scene.add(BsunLight);


// Directional light
const sunLight = new THREE.DirectionalLight('#ffffff', 0.5)
sunLight.position.set(4, 5, - 2)
gui.add(sunLight, 'intensity').min(0).max(1).step(0.001)
gui.add(sunLight.position, 'x').min(- 5).max(5).step(0.001)
gui.add(sunLight.position, 'y').min(- 5).max(5).step(0.001)
gui.add(sunLight.position, 'z').min(- 5).max(5).step(0.001)
scene.add(sunLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 10
camera.position.z = 20
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const positionAttribute = water.geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const waveHeight = Math.sin(x * 0.3 + elapsedTime) * 0.8 + Math.cos(y * 0.3 + elapsedTime) * 0.8;
        positionAttribute.setZ(i, waveHeight);
    }
    positionAttribute.needsUpdate = true;
    animateWaves()
    animateDoubleLayerWaves()
    animateFountainParticles()
    animateWavesWithInteraction()
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()