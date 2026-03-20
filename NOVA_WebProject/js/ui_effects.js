// N.O.V.A. UI Effects - Arc Launcher Subsystem

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Configuración de Aplicaciones del Cajón Circular
    const apps = [
        { name: "Gemini AI", icon: "auto_awesome", action: () => window.novaSpeak("Gemini AI no tiene acceso local directo, pero procesaré su solicitud mediante mis módulos integrados.") },
        { name: "Google Drive", icon: "add_to_drive", action: () => window.herramientasWorkspace.abrirDriveWindow() },
        { name: "Gmail", icon: "mail", action: () => window.herramientasWorkspace.abrirGmailWindow() },
        { name: "Pantalla Directo", icon: "monitor", action: () => window.herramientasWorkspace.abrirScreenShareWindow() },
        { name: "Calendar", icon: "calendar_month", action: () => window.novaSpeak("Ejecutando integración de agenda...") },
        { name: "Proyección CAD", icon: "view_in_ar", action: () => window.cargarModeloHolografico('models/test_model.stl') },
        { name: "Ajustes", icon: "settings", action: () => window.novaSpeak("Accediendo a la configuración del Kernel N-OS.") }
    ];

    const arcContainer = document.getElementById('arc-menu-container');
    const launcherBtn = document.getElementById('arc-launcher-btn');
    let isMenuOpen = false;

    // Generar elementos HTML
    apps.forEach((app, index) => {
        const item = document.createElement('div');
        item.className = 'arc-item';
        item.setAttribute('data-name', app.name);
        item.innerHTML = `<i class="material-icons">${app.icon}</i>`;
        
        // Al hacer clic, ejecutar acción y cerrar menú
        item.addEventListener('click', () => {
            app.action();
            toggleArcMenu();
        });

        arcContainer.appendChild(item);
    });

    const arcItems = document.querySelectorAll('.arc-item');

    // Función matemática para desplegar en curva (Lado derecho de la pantalla)
    function toggleArcMenu() {
        isMenuOpen = !isMenuOpen;
        const radius = 180; // Qué tan curvo es el menú
        const startAngle = -Math.PI / 2.5; // Ángulo inicial (arriba)
        const endAngle = Math.PI / 2.5;   // Ángulo final (abajo)
        
        arcItems.forEach((item, i) => {
            if (isMenuOpen) {
                // Calcular posición a lo largo del arco
                const angle = startAngle + (i * (endAngle - startAngle) / (apps.length - 1));
                
                // Matemáticas para arco en el lado derecho: 
                // X es negativo porque va hacia la izquierda desde el contenedor derecho
                const x = -Math.cos(angle) * radius; 
                const y = Math.sin(angle) * radius;

                // Aplicamos retraso escalonado para efecto cascada
                setTimeout(() => {
                    item.style.opacity = '1';
                    // Centramos el cálculo (el contenedor mide 600px de alto, la mitad es 300)
                    item.style.transform = `translate(${x}px, ${y + 275}px) scale(1)`;
                }, i * 50); // 50ms de retraso por item

                // Cambiar icono del botón principal
                launcherBtn.innerHTML = '<i class="material-icons" style="font-size: 32px;">close</i>';
                launcherBtn.style.borderColor = '#ff5f56';
                launcherBtn.style.color = '#ff5f56';
                
            } else {
                // Contraer todo al centro
                setTimeout(() => {
                    item.style.opacity = '0';
                    item.style.transform = `translate(0px, 275px) scale(0)`;
                }, (apps.length - 1 - i) * 30); // Cierre en orden inverso

                launcherBtn.innerHTML = '<i class="material-icons" style="font-size: 32px;">apps</i>';
                launcherBtn.style.borderColor = 'var(--main-cyan)';
                launcherBtn.style.color = 'var(--main-cyan)';
            }
        });
    }

    // Vincular botón principal
    launcherBtn.addEventListener('click', toggleArcMenu);

    // Cerrar el menú si se hace clic fuera de él
    document.getElementById('n-os-workspace').addEventListener('click', () => {
        if(isMenuOpen) toggleArcMenu();
    });

    // 2. Efecto Cibernético en las Ventanas (Mantenemos el existente)
    const originalCreateWindow = window.WindowManager.createWindow.bind(window.WindowManager);
    window.WindowManager.createWindow = function(title, content, options = {}) {
        const win = originalCreateWindow(title, content, options);
        win.style.opacity = 0;
        win.style.transform += ' scale(0.9)';
        win.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        setTimeout(() => {
            win.style.opacity = 1;
            win.style.transform = win.style.transform.replace(' scale(0.9)', '');
        }, 10);
        return win;
    };
});
