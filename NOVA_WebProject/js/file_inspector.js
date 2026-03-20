document.addEventListener('DOMContentLoaded', () => {
    const inspector = document.getElementById('file-inspector');
    const toggleBtn = document.getElementById('toggle-inspector');
    const taskbarBtn = document.getElementById('btn-inspector');
    const dropZone = document.getElementById('drop-zone');

    const toggleInspector = () => {
        inspector.classList.toggle('open');
        toggleBtn.textContent = inspector.classList.contains('open') ? 'chevron_left' : 'chevron_right';
    };
    toggleBtn.addEventListener('click', toggleInspector);
    taskbarBtn.addEventListener('click', toggleInspector);

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) procesarArchivo3D(e.dataTransfer.files[0]);
    });

    function procesarArchivo3D(file) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!['stl', 'fbx', 'glb', 'gltf'].includes(fileExt)) {
            if (window.novaSpeak) window.novaSpeak("Formato no compatible. Use STL, FBX o GLB.");
            return;
        }

        const url = URL.createObjectURL(file);
        const container = document.createElement('div');
        container.style.width = '100%'; container.style.height = '100%';
        container.style.background = 'radial-gradient(circle, rgba(79,172,254,0.1) 0%, rgba(0,0,0,1) 100%)';
        
        const win = window.WindowManager.createWindow(`Visor CAD: ${file.name}`, container, {w: 500, h: 400});
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0x4facfe, 1);
        dirLight.position.set(10, 20, 10); scene.add(dirLight);

        let loader = fileExt === 'stl' ? new THREE.STLLoader() : (fileExt === 'fbx' ? new THREE.FBXLoader() : new THREE.GLTFLoader());

        loader.load(url, (object) => {
            let model = (fileExt === 'glb' || fileExt === 'gltf') ? object.scene : object;
            if (fileExt === 'stl') model = new THREE.Mesh(object, new THREE.MeshPhongMaterial({ color: 0x00ff88, wireframe: true }));
            
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            scene.add(model);

            const size = box.getSize(new THREE.Vector3()).length();
            camera.position.set(0, size * 0.5, size);
            controls.update();
        });

        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controls.update(); renderer.render(scene, camera);
        };
        animate();

        new ResizeObserver(() => {
            if(container.clientWidth === 0) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight);
        }).observe(container);

        win.querySelector('.win-close').addEventListener('click', () => {
            cancelAnimationFrame(animationId); URL.revokeObjectURL(url); renderer.dispose();
        });
    }
});
