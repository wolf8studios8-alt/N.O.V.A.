// Ruta: /NOVA_WebProject/js/hologram_renderer.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hologram-container');
    const btnLoadStl = document.getElementById('btn-load-stl');
    
    // 1. Configuración de la Escena Básica
    const scene = new THREE.Scene();
    
    // 2. Configuración de la Cámara
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, -100, 100); // Vista isométrica inicial
    camera.up.set(0, 0, 1); // Z es arriba en modelos CAD/STL estándar

    // 3. Configuración del Renderizador
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // Alpha true para fondo transparente
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 4. Controles (Para poder rotar el modelo con el dedo en la tablet)
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 5. Iluminación Holográfica
    const ambientLight = new THREE.AmbientLight(0x404040); // Luz base
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x4facfe, 1); // Luz azul N.O.V.A.
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    const gridHelper = new THREE.GridHelper(200, 50, 0x4facfe, 0x111111);
    gridHelper.rotation.x = Math.PI / 2; // Alinear con el plano XY
    scene.add(gridHelper);

    // 6. Cargador STL
    let currentMesh = null;
    const loader = new THREE.STLLoader();

    function loadHologram(filePath) {
        if (currentMesh) {
            scene.remove(currentMesh);
            currentMesh.geometry.dispose();
            currentMesh.material.dispose();
        }

        loader.load(
            filePath,
            function (geometry) {
                // Material Wireframe brillante tipo holograma
                const material = new THREE.MeshPhongMaterial({ 
                    color: 0x00ff88, 
                    specular: 0x111111, 
                    shininess: 200,
                    wireframe: true // Estilo plano/blueprint
                });
                
                currentMesh = new THREE.Mesh(geometry, material);
                
                // Centrar el modelo geométricamente
                geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                geometry.boundingBox.getCenter(center);
                currentMesh.position.sub(center);

                scene.add(currentMesh);
                
                // Ajustar cámara para que el objeto encaje
                const maxDim = Math.max(
                    geometry.boundingBox.max.x - geometry.boundingBox.min.x,
                    geometry.boundingBox.max.y - geometry.boundingBox.min.y,
                    geometry.boundingBox.max.z - geometry.boundingBox.min.z
                );
                camera.position.set(0, -maxDim * 1.5, maxDim);
                controls.target.set(0, 0, 0);
                controls.update();

                console.log(`Modelo ${filePath} cargado con éxito.`);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% cargado');
            },
            (error) => {
                console.error('Error cargando el modelo STL:', error);
                alert("No se encontró el modelo. Asegúrese de tener un archivo 'test_model.stl' en la carpeta '/NOVA_WebProject/models/'.");
            }
        );
    }

    // 7. Bucle de Animación
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotación lenta automática para efecto holograma
        if (currentMesh) {
            currentMesh.rotation.z += 0.005;
        }
        
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // Evento de Botón
    btnLoadStl.addEventListener('click', () => {
        // Carga un archivo de prueba. Requiere que exista en esa ruta.
        loadHologram('models/test_model.stl');
    });

    // Ajuste al redimensionar la ventana/tablet
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});
