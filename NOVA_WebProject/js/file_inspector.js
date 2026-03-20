// N.O.V.A. File Inspector & 3D Windowing Subsystem

document.addEventListener('DOMContentLoaded', () => {
    const inspector = document.getElementById('file-inspector');
    const toggleBtn = document.getElementById('toggle-inspector');
    const taskbarBtn = document.getElementById('btn-inspector');
    const dropZone = document.getElementById('drop-zone');

    // Control de Interfaz
    const toggleInspector = () => {
        inspector.classList.toggle('open');
        toggleBtn.textContent = inspector.classList.contains('open') ? 'chevron_left' : 'chevron_right';
    };
    toggleBtn.addEventListener('click', toggleInspector);
    taskbarBtn.addEventListener('click', toggleInspector);

    // Lógica Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            procesarArchivo3D(file);
        }
    });

    // Carga de Mallas en Ventanas Independientes (Soporte FBX, GLB, STL)
    function procesarArchivo3D(file) {
        if (window.novaLog) window.novaLog(`> Analizando archivo local: ${file.name}`);
        
        const fileExt = file.name.split('.').pop().toLowerCase();
        const validExts = ['stl', 'fbx', 'glb', 'gltf'];
        
        if (!validExts.includes(fileExt)) {
            if (window.novaSpeak) window.novaSpeak("Formato estructural no compatible detectado. Por favor, utilice extensiones CAD estándar.");
            return;
        }

        const url = URL.createObjectURL(file);
        
        // Crear Contenedor HTML para la Ventana
        const container = document.createElement('div');
        container.style.width = '100%'; container.style.height = '100%';
        container.style.background = 'radial-gradient(circle, rgba(79,172,254,0.1) 0%, rgba(0,0,0,1) 100%)';
        
        const win = window.WindowManager.createWindow(`Visor CAD: ${file.name}`, container, {w: 500, h: 400});
        
        // Renderizador Three.js en Ventana Aislada
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0x4facfe, 1);
        dirLight.position.set(10, 20, 10);
        scene.add(dirLight);

        let loader;
        if (fileExt === 'stl') loader = new THREE.STLLoader();
        else if (fileExt === 'fbx') loader = new THREE.FBXLoader();
        else loader = new THREE.GLTFLoader();

        loader.load(url, (object) => {
            let model = (fileExt === 'glb' || fileExt === 'gltf') ? object.scene : object;
            
            // Material Holográfico Básico si es STL
            if (fileExt === 'stl') {
                const mat = new THREE.MeshPhongMaterial({ color: 0x00ff88, wireframe: true });
                model = new THREE.Mesh(object, mat);
            }

            // Centrar
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            scene.add(model);

            const size = box.getSize(new THREE.Vector3()).length();
            camera.position.set(0, size * 0.5, size);
            controls.update();

            if (window.novaSpeak) window.novaSpeak("Renderizado de la pieza completado en terminal aislada.");
        });

        // Loop de Animación Local a la ventana
        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Limpiar recursos al cerrar la ventana o redimensionar
        new ResizeObserver(() => {
            if(container.clientWidth === 0) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }).observe(container);

        win.querySelector('.win-close').addEventListener('click', () => {
            cancelAnimationFrame(animationId);
            URL.revokeObjectURL(url);
            renderer.dispose();
        });
    }
});
