/**
 * CLOUD COMPUTERS - Three.js 3D WebGL Hero Engine
 * Renders an interactive 3D extruded glass cloud with internal server chassis,
 * orbiting data rings, floating particle mesh, and dynamic cursor lighting.
 */

(function () {
  'use strict';

  function initThreeHero() {
    const container = document.getElementById('hero-three-canvas');
    if (!container || typeof THREE === 'undefined') {
      console.warn('Three.js or hero-three-canvas container not available.');
      return;
    }

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 540;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.8);

    // 2. WebGL Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('WebGL not supported:', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 3. Dynamic Lighting System
    const ambientLight = new THREE.AmbientLight(0x06152d, 1.8);
    scene.add(ambientLight);

    const dirLightCyan = new THREE.DirectionalLight(0x00f0ff, 2.6);
    dirLightCyan.position.set(5, 8, 6);
    scene.add(dirLightCyan);

    const dirLightPurple = new THREE.DirectionalLight(0x7928ca, 2.2);
    dirLightPurple.position.set(-6, -4, 4);
    scene.add(dirLightPurple);

    const rimLightBlue = new THREE.DirectionalLight(0x0066ff, 1.8);
    rimLightBlue.position.set(0, 5, -5);
    scene.add(rimLightBlue);

    // Interactive cursor-following point light
    const cursorLight = new THREE.PointLight(0x00ffff, 3.5, 12);
    cursorLight.position.set(0, 0, 4);
    scene.add(cursorLight);

    // 4. Main 3D Pivot Group
    const modelRoot = new THREE.Group();
    modelRoot.scale.set(0.78, 0.78, 0.78);
    scene.add(modelRoot);

    // 5. Build 3D Cloud Geometry (matching logo contour)
    const cloudShape = new THREE.Shape();
    cloudShape.moveTo(-1.7, -0.6);
    cloudShape.lineTo(1.7, -0.6);
    cloudShape.bezierCurveTo(2.35, -0.6, 2.45, 0.35, 1.85, 0.52);
    cloudShape.bezierCurveTo(2.25, 1.15, 1.6, 1.65, 0.95, 1.48);
    cloudShape.bezierCurveTo(0.68, 2.22, -0.68, 2.22, -0.95, 1.48);
    cloudShape.bezierCurveTo(-1.6, 1.65, -2.25, 1.15, -1.85, 0.52);
    cloudShape.bezierCurveTo(-2.45, 0.35, -2.35, -0.6, -1.7, -0.6);

    const extrudeSettings = {
      depth: 0.5,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.15,
      bevelThickness: 0.18
    };

    const cloudGeo = new THREE.ExtrudeGeometry(cloudShape, extrudeSettings);
    cloudGeo.center();

    // Shimmering Cyber Wireframe Material (Default Mode)
    const cloudMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x0055aa,
      emissiveIntensity: 0.65,
      metalness: 0.5,
      roughness: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.92
    });

    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMaterial);
    modelRoot.add(cloudMesh);

    // Glowing Holographic Wireframe Edge Lattice
    const edgesGeo = new THREE.EdgesGeometry(cloudGeo, 18);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });
    const cloudWireframe = new THREE.LineSegments(edgesGeo, edgesMat);
    modelRoot.add(cloudWireframe);

    // 6. Internal Server Rack Blades & LEDs inside the Cloud Core
    const serverGroup = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(2.3, 0.2, 0.42);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x07152b,
      metalness: 0.85,
      roughness: 0.25
    });

    const leds = [];
    const ledGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const ledGreenMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    const ledCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ledAmberMat = new THREE.MeshBasicMaterial({ color: 0xffb800 });

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = (i - 1) * 0.36 - 0.04;
      serverGroup.add(blade);

      // Add 4 activity LEDs per server blade
      const l1 = new THREE.Mesh(ledGeo, ledGreenMat);
      l1.position.set(0.7, blade.position.y, 0.23);
      serverGroup.add(l1);
      leds.push({ mesh: l1, baseColor: 0x00ffaa, speed: 4 + i * 2 });

      const l2 = new THREE.Mesh(ledGeo, ledCyanMat);
      l2.position.set(0.85, blade.position.y, 0.23);
      serverGroup.add(l2);
      leds.push({ mesh: l2, baseColor: 0x00f0ff, speed: 6 + i * 3 });

      const l3 = new THREE.Mesh(ledGeo, ledCyanMat);
      l3.position.set(1.0, blade.position.y, 0.23);
      serverGroup.add(l3);
      leds.push({ mesh: l3, baseColor: 0x00f0ff, speed: 5 + i * 2.5 });

      const l4 = new THREE.Mesh(ledGeo, ledAmberMat);
      l4.position.set(-0.95, blade.position.y, 0.23);
      serverGroup.add(l4);
      leds.push({ mesh: l4, baseColor: 0xffb800, speed: 3 + i * 1.5 });
    }
    modelRoot.add(serverGroup);

    // 7. Orbiting 3D Cyber Rings
    const ring1Geo = new THREE.TorusGeometry(3.1, 0.022, 16, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.65
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat1);
    ring1.rotation.x = Math.PI / 2.8;
    ring1.rotation.y = Math.PI / 6;
    modelRoot.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.6, 0.02, 16, 120);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x7928ca,
      transparent: true,
      opacity: 0.55
    });
    const ring2 = new THREE.Mesh(ring2Geo, ringMat2);
    ring2.rotation.x = -Math.PI / 3;
    ring2.rotation.z = Math.PI / 5;
    modelRoot.add(ring2);

    // Orbiting Data Packet Spheres
    const packetGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const packetMat1 = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const packet1 = new THREE.Mesh(packetGeo, packetMat1);
    ring1.add(packet1);

    const packetMat2 = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    const packet2 = new THREE.Mesh(packetGeo, packetMat2);
    ring2.add(packet2);

    // 8. 3D Floating Particle Constellation
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
      particleScales[i] = 0.5 + Math.random() * 1.5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00d2ff,
      size: 0.055,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    // 9. Interactive Mouse Tracking & Drag Orbit State
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let autoRotate = true;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouseX = (clientX / rect.width) * 2 - 1;
      mouseY = -(clientY / rect.height) * 2 + 1;

      // Update cursor 3D point light position
      cursorLight.position.x = mouseX * 4;
      cursorLight.position.y = mouseY * 3;

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        targetRotationY += deltaX * 0.012;
        targetRotationX += deltaY * 0.012;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        targetRotationY = mouseX * 0.55;
        targetRotationX = -mouseY * 0.4;
      }
    };

    const handleMouseDown = (e) => {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseLeave = () => {
      isDragging = false;
      targetRotationX = 0;
      targetRotationY = 0;
      cursorLight.position.set(0, 0, 4);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Touch events for mobile
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        targetRotationY += deltaX * 0.015;
        targetRotationX += deltaY * 0.015;

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      isDragging = false;
    });

    // 10. HUD Controls Integration
    const btnRotate = document.getElementById('btn-3d-rotate');
    const btnWireframe = document.getElementById('btn-3d-wireframe');
    const btnReset = document.getElementById('btn-3d-reset');

    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        autoRotate = !autoRotate;
        btnRotate.classList.toggle('active', autoRotate);
      });
    }

    if (btnWireframe) {
      btnWireframe.classList.add('active');
      btnWireframe.addEventListener('click', () => {
        cloudMaterial.wireframe = !cloudMaterial.wireframe;
        btnWireframe.classList.toggle('active', cloudMaterial.wireframe);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        targetRotationX = 0;
        targetRotationY = 0;
        modelRoot.rotation.set(0, 0, 0);
        autoRotate = true;
        if (btnRotate) btnRotate.classList.add('active');
        if (btnWireframe) {
          cloudMaterial.wireframe = true;
          btnWireframe.classList.add('active');
        }
      });
    }

    // Expose root for inspection / testing
    window._threeHeroRoot = modelRoot;
    window._threeHeroMaterial = cloudMaterial;

    // 11. Render Loop
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth inertial rotation
      if (autoRotate && !isDragging) {
        modelRoot.rotation.y += 0.008;
      }

      modelRoot.rotation.x += (targetRotationX - modelRoot.rotation.x) * 0.06;
      if (!autoRotate) {
        modelRoot.rotation.y += (targetRotationY - modelRoot.rotation.y) * 0.06;
      }

      // Gentle floating bob (subtle amplitude)
      modelRoot.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

      // Orbiting packets around rings
      const p1Angle = elapsedTime * 2.2;
      packet1.position.x = Math.cos(p1Angle) * 3.1;
      packet1.position.y = Math.sin(p1Angle) * 3.1;

      const p2Angle = -elapsedTime * 1.8;
      packet2.position.x = Math.cos(p2Angle) * 3.6;
      packet2.position.y = Math.sin(p2Angle) * 3.6;

      // Ring counter-rotations
      ring1.rotation.z += 0.004;
      ring2.rotation.y += 0.003;

      // Slow particle field drift
      particlePoints.rotation.y = elapsedTime * 0.025;
      particlePoints.rotation.x = Math.sin(elapsedTime * 0.015) * 0.1;

      // Blinking LEDs
      leds.forEach((led) => {
        const intensity = 0.4 + Math.sin(elapsedTime * led.speed) * 0.6;
        led.mesh.scale.setScalar(0.8 + intensity * 0.4);
      });

      renderer.render(scene, camera);
    }

    animate();

    // 12. Resize Observer
    function handleResize() {
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener('resize', handleResize);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeHero);
  } else {
    initThreeHero();
  }
})();
