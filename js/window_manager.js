// N.O.V.A. Operative System - Window Manager Core

class NOSTextEditor {
    constructor() {
        this.desktop = document.getElementById('n-os-workspace');
        this.windowCount = 0;
        this.activeWindow = null;
    }

    /**
     * Crea una nueva terminal N-OS en el área de trabajo.
     * @param {string} title Título de la ventana.
     * @param {HTMLElement|string} content Contenido HTML o elemento para el interio
     * @param {object} options Opciones de posición y tamaño.
     */
    createWindow(title, content, options = {}) {
        this.windowCount++;
        const id = `nos-win-${this.windowCount}`;
        
        // Parámetros por defecto para despliegue
        const opt = {
            x: options.x || 50 + (this.windowCount * 20),
            y: options.y || 50 + (this.windowCount * 20),
            w: options.w || 400,
            h: options.h || 300,
            minW: options.minW || 300,
            minH: options.minH || 200,
            z: options.z || 500
        };

        // 1. Crear Estructura Estructural (DOM)
        const win = document.createElement('div');
        win.className = 'n-os-window';
        win.id = id;
        win.style.width = opt.w + 'px';
        win.style.height = opt.h + 'px';
        win.style.left = opt.x + 'px';
        win.style.top = opt.y + 'px';
        win.style.zIndex = opt.z;
        
        // Barra de Título (Header)
        const header = document.createElement('div');
        header.className = 'window-header';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'window-title';
        titleSpan.textContent = title;
        
        const controls = document.createElement('div');
        controls.className = 'window-controls';
        
        const minBtn = document.createElement('button');
        minBtn.className = 'win-btn win-min';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'win-btn win-close';
        
        controls.appendChild(minBtn);
        controls.appendChild(closeBtn);
        header.appendChild(titleSpan);
        header.appendChild(controls);
        win.appendChild(header);

        // Contenido Interno
        const winContent = document.createElement('div');
        winContent.className = 'window-content';
        
        if (typeof content === 'string') {
            winContent.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            winContent.appendChild(content);
        }
        win.appendChild(winContent);

        // Tirador de Redimensionamiento (Resizer)
        const resizer = document.createElement('div');
        resizer.className = 'window-resizer';
        win.appendChild(resizer);

        // 2. Despliegue en el Escritorio
        this.desktop.appendChild(win);
        this.setActiveWindow(win);

        // 3. Inicializar Motores Físicos de Interacción
        this.initDragging(win, header);
        this.initResizing(win, resizer, opt.minW, opt.minH);
        
        // Eventos de Sistema
        win.addEventListener('mousedown', () => this.setActiveWindow(win));
        closeBtn.addEventListener('click', () => win.remove());
        
        return win;
    }

    setActiveWindow(windowEl) {
        if (this.activeWindow) {
            this.activeWindow.classList.remove('active-window');
        }
        this.activeWindow = windowEl;
        this.activeWindow.classList.add('active-window');
        
        // Algoritmo de Z-Index para mantener la ventana activa al frente
        let maxZ = 500;
        document.querySelectorAll('.n-os-window').forEach(el => {
            const z = parseInt(el.style.zIndex);
            if (z > maxZ) maxZ = z;
        });
        this.activeWindow.style.zIndex = maxZ + 1;
    }

    // --- MOTOR DE CINEMÁTICA INVERSA (Arrastre) ---
    initDragging(win, header) {
        let offsetX, offsetY, isDragging = false;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return; // Bloquear arrastre en botones
            isDragging = true;
            this.setActiveWindow(win);
            offsetX = e.clientX - win.offsetLeft;
            offsetY = e.clientY - win.offsetTop;
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            header.style.userSelect = 'none'; // Prevenir selección de texto accidental
        });

        const drag = (e) => {
            if (!isDragging) return;
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            
            // Restricciones de colisión con los bordes de la pantalla
            if (y < 0) y = 0; 
            if (x < 0 - (win.clientWidth / 2)) x = 0 - (win.clientWidth / 2);

            win.style.left = x + 'px';
            win.style.top = y + 'px';
        };

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }

    // --- MOTOR DE GEOMETRÍA DINÁMICA (Redimensionamiento) ---
    initResizing(win, resizer, minW, minH) {
        let isResizing = false, startW, startH, startX, startY;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            this.setActiveWindow(win);
            startW = parseInt(win.style.width, 10);
            startH = parseInt(win.style.height, 10);
            startX = e.clientX;
            startY = e.clientY;
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            e.preventDefault();
        });

        const resize = (e) => {
            if (!isResizing) return;
            let newW = startW + (e.clientX - startX);
            let newH = startH + (e.clientY - startY);

            // Mantener proporciones mínimas de seguridad
            if (newW < minW) newW = minW;
            if (newH < minH) newH = minH;

            win.style.width = newW + 'px';
            win.style.height = newH + 'px';
        };

        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    }
}

// Inicialización del subsistema al cargar el núcleo
document.addEventListener('DOMContentLoaded', () => {
    window.WindowManager = new NOSTextEditor();
});
