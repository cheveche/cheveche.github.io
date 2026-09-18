document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing sphere...");
    
    const canvas = document.getElementById('scene');
    if (!canvas) {
        console.error("Canvas element #scene not found!");
        return;
    }

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = null; 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    console.log("Three.js renderer initialized");

    // 2. Procedural Texture Generation
    function getProceduralTexture() {
        const size = 64;
        const data = new Uint8Array(4 * size * size);
        for (let i = 0; i < size * size; i++) {
            const stride = i * 4;
            const x = (i % size) - size / 2;
            const y = Math.floor(i / size) - size / 2;
            const dist = Math.sqrt(x * x + y * y);
            const alpha = Math.max(0, 1 - dist / (size / 2)); 
            
            data[stride] = 255;       
            data[stride + 1] = 255;   
            data[stride + 2] = 255;   
            data[stride + 3] = alpha * 255; 
        }
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.needsUpdate = true;
        return texture;
    }

    // 3. Particle Sphere Geometry
    const particleCount = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color1 = new THREE.Color(0x38bdf8); 
    const color2 = new THREE.Color(0x818cf8); 
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < particleCount; i++) {
        const y = 1 - (i / (particleCount - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;

        const sphereRadius = 16;
        positions[i * 3] = Math.cos(theta) * radius * sphereRadius;
        positions[i * 3 + 1] = y * sphereRadius;
        positions[i * 3 + 2] = Math.sin(theta) * radius * sphereRadius;

        const mixedColor = color1.clone().lerp(color2, Math.random());
        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;

        sizes[i] = Math.random() * 3 + 1; 
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 4. Shader Material
    const vertexShaderEl = document.getElementById('wrapVertexShader');
    const fragmentShaderEl = document.getElementById('wrapFragmentShader');

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: getProceduralTexture() } // FIXED: Renamed from 'texture' to 'uTexture'
        },
        vertexShader: vertexShaderEl ? vertexShaderEl.textContent : '',
        fragmentShader: fragmentShaderEl ? fragmentShaderEl.textContent : '',
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending 
    });

    const sphere = new THREE.Points(geometry, material);
    scene.add(sphere);
    console.log("Sphere added to scene");

    // 5. Interactivity & Animation
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.001;
        mouseY = (event.clientY - windowHalfY) * 0.001;
    }, { passive: true });

    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouseX = (event.touches[0].clientX - windowHalfX) * 0.001;
            mouseY = (event.touches[0].clientY - windowHalfY) * 0.001;
        }
    }, { passive: true });

    const clock = new THREE.Clock();

    function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // 1. MOUSE EASING (Lower number = slower, lazier response to mouse)
    // Changed from 0.05 to 0.02 for a smoother, more delayed follow
    targetX += (mouseX - targetX) * 0.002;
    targetY += (mouseY - targetY) * 0.002;

    // 2. BASE AUTO-ROTATION (Lower number = slower spinning)
    // Changed from 0.002 to 0.00005 (4x slower) on Y-axis
    // Changed from 0.001 to 0.00002 (5x slower) on X-axis
    sphere.rotation.y += 0.00005 + targetX;
    sphere.rotation.x += 0.00002 + targetY;

    // 3. BREATHING PULSE SPEED (Lower number = slower expansion/contraction)
    // Changed from 0.8 to 0.3 for a very slow, ambient "breathing" effect
    const scale = 1 + Math.sin(elapsedTime * 0.003) * 0.0003;
    sphere.scale.set(scale, scale, scale);

    renderer.render(scene, camera);
    }

    animate();
    console.log("Animation loop started");

    // 6. Responsive Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
    });
});
