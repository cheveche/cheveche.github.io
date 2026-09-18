document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('scene');
    if (!canvas) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent to show CSS background

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Cap pixel ratio at 2 to prevent mobile GPU overheating
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 

    // 2. Procedural Texture Generation (Soft glowing dot)
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

    const color1 = new THREE.Color(0x38bdf8); // Cyan/Light Blue
    const color2 = new THREE.Color(0x818cf8); // Soft Purple
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996

    for (let i = 0; i < particleCount; i++) {
        // True Fibonacci Sphere algorithm for perfect, pole-to-pole distribution
        const y = 1 - (i / (particleCount - 1)) * 2; // y goes from 1 to -1
        const radius = Math.sqrt(1 - y * y); // Radius at y
        const theta = goldenAngle * i; // Golden angle increment

        const sphereRadius = 16;
        positions[i * 3] = Math.cos(theta) * radius * sphereRadius;
        positions[i * 3 + 1] = y * sphereRadius;
        positions[i * 3 + 2] = Math.sin(theta) * radius * sphereRadius;

        // Mix colors randomly between color1 and color2
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
            texture: { value: getProceduralTexture() }
        },
        vertexShader: vertexShaderEl ? vertexShaderEl.textContent : '',
        fragmentShader: fragmentShaderEl ? fragmentShaderEl.textContent : '',
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending 
    });

    const sphere = new THREE.Points(geometry, material);
    scene.add(sphere);

    // 5. Interactivity & Animation
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    // Changed to 'let' so they can be updated on resize
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    // Mouse movement (passive for performance)
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.001;
        mouseY = (event.clientY - windowHalfY) * 0.001;
    }, { passive: true });

    // Touch movement (passive for performance)
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

        // Smooth easing for mouse follow
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        // Base auto-rotation + mouse influence
        sphere.rotation.y += 0.002 + targetX;
        sphere.rotation.x += 0.001 + targetY;

        // Gentle "breathing" pulse effect
        const scale = 1 + Math.sin(elapsedTime * 0.8) * 0.03;
        sphere.scale.set(scale, scale, scale);

        renderer.render(scene, camera);
    }

    animate();

    // 6. Responsive Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // FIX: Recalculate center points to prevent mouse tracking drift
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
    });
});
