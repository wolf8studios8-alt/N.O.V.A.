// Módulo de Visualización Holográfica 3D

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hologram-container');
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

    scene.add(new THREE.AmbientLight(0x404040));
    const directionalLight = new THREE.DirectionalLight(0x4facfe, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    const gridHelper = new THREE.GridHelper(200, 50, 0x4facfe, 0x111111);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    let currentMesh = null;
    const loader = new THREE.STLLoader();

    // Función expuesta globalmente para ser llamada desde Google Drive o localmente
    window.cargarModeloHolografico = function(urlOPath) {
        if (currentMesh) {
            scene.remove(currentMesh);
            currentMesh.geometry.dispose();
            currentMesh.material.dispose();
        }

        if (window.novaLog) window.novaLog(`> Cargando malla estructural desde: ${urlOPath}`);

        loader.load(urlOPath, (geometry) => {
            const material = new THREE.MeshPhongMaterial({ color: 0x00ff88, wireframe: true });
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
            camera.position.set(0, -maxDim * 1.5, maxDim);
            controls.target.set(0, 0, 0);
            controls.update();
            
            if (window.novaSpeak) window.novaSpeak("Proyección estructural completada, Señor.");
        }, undefined, (error) => {
            console.error(error);
            if (window.novaLog) window.novaLog("ERROR: Fallo al cargar la geometría. Asegúrese de que el archivo existe.");
        });
    };

    function animate() {
        requestAnimationFrame(animate);
        if (currentMesh) currentMesh.rotation.z += 0.005;
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    document.getElementById('btn-load-stl').addEventListener('click', () => {
        window.cargarModeloHolografico('models/test_model.stl');
    });

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});
