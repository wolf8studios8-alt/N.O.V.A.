// N.O.V.A. File Inspector & 3D Editor (v4.0)

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
        if (!['stl', 'fbx', 'glb', 'gltf'].includes(fileExt)) return;

        const url = URL.createObjectURL(file);
        const container = document.createElement('div');
        container.style.width = '100%'; container.style.height = '100%';
        container.style.position = 'relative';
        container.style.background = 'radial-gradient(circle, rgba(79,172,254,0.1) 0%, rgba(0,0,0,1) 100%)';
        
        // --- PANEL DE EDICIÓN 3D ---
        const editorUI = document.createElement('div');
        editorUI.style.cssText = 'position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.8); border:1px solid #4facfe; padding:10px; border-radius:5px; z-index:10; font-size:0.8rem;';
        editorUI.innerHTML = `
            <div style="margin-bottom:5px; color:#4facfe; font-weight:bold;">Inspector de Propiedades</div>
            <label>Escala: <input type="range" id="scale-slider" min="0.1" max="3" step="0.1" value="1" style="width:100%"></label>
            <label>Color Base: <input type="color" id="color-picker" value="#00ff88" style="width:100%; margin-top:5px;"></label>
            <label style="display:flex; align-items:center; margin-top:5px;"><input type="checkbox" id="wireframe-toggle" checked> Wireframe</label>
        `;
        container.appendChild(editorUI);

        const win = window.WindowManager.createWindow(`Editor CAD: ${file.name}`, container, {w: 600, h: 450});
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10); scene.add(dirLight);

        let loader = fileExt === 'stl' ? new THREE.STLLoader() : (fileExt === 'fbx' ? new THREE.FBXLoader() : new THREE.GLTFLoader());
        let activeModel = null;

        loader.load(url, (object) => {
            let model = (fileExt === 'glb' || fileExt === 'gltf') ? object.scene : object;
            
            // Forzar material editable
            const mat = new THREE.MeshPhongMaterial({ color: 0x00ff88, wireframe: true });
            if (fileExt === 'stl') {
                model = new THREE.Mesh(object, mat);
            } else {
                model.traverse((child) => { if (child.isMesh) child.material = mat; });
            }
            
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            scene.add(model);
            activeModel = model;

            const size = box.getSize(new THREE.Vector3()).length();
            camera.position.set(0, size * 0.5, size);
            controls.update();

            // Vincular Controles UI a la malla
            win.querySelector('#scale-slider').addEventListener('input', (e) => {
                const s = parseFloat(e.target.value);
                activeModel.scale.set(s, s, s);
            });
            win.querySelector('#color-picker').addEventListener('input', (e) => {
                if (fileExt === 'stl') activeModel.material.color.set(e.target.value);
                else activeModel.traverse((c) => { if (c.isMesh) c.material.color.set(e.target.value); });
            });
            win.querySelector('#wireframe-toggle').addEventListener('change', (e) => {
                const isWire = e.target.checked;
                if (fileExt === 'stl') activeModel.material.wireframe = isWire;
                else activeModel.traverse((c) => { if (c.isMesh) c.material.wireframe = isWire; });
            });
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
