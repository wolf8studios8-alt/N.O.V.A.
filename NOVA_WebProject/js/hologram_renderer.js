// Módulo de Visualización Holográfica 3D (Fondo del Escritorio N-OS)

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hologram-3d-bg');
    if (!container) return; 

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, -100, 100);
    camera.up.set(0, 0, 1);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false; 
    controls.enableZoom = true;

    const directionalLight = new THREE.DirectionalLight(0x4facfe, 1); 
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    const gridHelper = new THREE.GridHelper(400, 100, 0x111111, 0x1a1a1a);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -20; 
    scene.add(gridHelper);

    let currentMesh = null;
    const loader = new THREE.STLLoader();

    window.cargarModeloHolografico = function(urlOPath) {
        if (currentMesh) {
            scene.remove(currentMesh);
            currentMesh.geometry.dispose();
            currentMesh.material.dispose();
        }

        if (window.novaLog) window.novaLog(`> Cargando malla CAD local: ${urlOPath}`);

        loader.load(urlOPath, (geometry) => {
            const material = new THREE.MeshPhongMaterial({ 
                color: 0x00ff88, wireframe: true, wireframeLinewidth: 1, transparent: true, opacity: 0.8 
            });
            
            currentMesh = new THREE.Mesh(geometry, material);
            
            geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            geometry.boundingBox.getCenter(center);
            currentMesh.position.sub(center);

            scene.add(currentMesh);
            
            const maxDim = Math.max(
                geometry.boundingBox.max.x - geometry.boundingBox.min.x,
                geometry.boundingBox.max.y - geometry.boundingBox.min.y,
                geometry.boundingBox.max.z - geometry.boundingBox.min.z
            );
            camera.position.set(0, -maxDim * 1.5, maxDim * 0.8);
            controls.target.set(0, 0, 0);
            controls.update();
            
            if (window.novaSpeak) window.novaSpeak("Proyección CAD estructuralizada con éxito sobre el escritorio operativo, Señor.");
        }, undefined, (error) => {
            console.error(error);
            if (window.novaLog) window.novaLog(`ERROR: No se encontró el modelo. Asegúrese de tener 'test_model.stl' en la carpeta '/models/'.`);
        });
    };

    function animate() {
        requestAnimationFrame(animate);
        if (currentMesh) currentMesh.rotation.z += 0.002; 
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // PARCHE APLICADO: Solo asignar si el botón clásico existe.
    const btnTest3d = document.getElementById('btn-test-3d');
    if (btnTest3d) {
        btnTest3d.addEventListener('click', () => {
            window.cargarModeloHolografico('models/test_model.stl');
        });
    }

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});
