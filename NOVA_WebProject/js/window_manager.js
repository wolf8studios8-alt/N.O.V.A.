document.addEventListener('DOMContentLoaded', () => {
    const apps = [
        { name: "Google Drive", icon: "add_to_drive", action: () => window.herramientasWorkspace.abrirDriveWindow() },
        { name: "Gmail", icon: "mail", action: () => window.herramientasWorkspace.abrirGmailWindow() },
        { name: "Pantalla Directo", icon: "monitor", action: () => window.herramientasWorkspace.abrirScreenShareWindow() },
        { name: "Calendar", icon: "calendar_month", action: () => window.novaSpeak("Integración de agenda en desarrollo...") },
        { name: "Ajustes", icon: "settings", action: () => {
            if (window.novaSpeak) window.novaSpeak("Accediendo a la configuración del Kernel.");
            if (window.abrirConfiguracion) window.abrirConfiguracion();
        } }
    ];

    const arcContainer = document.getElementById('arc-menu-container');
    const launcherBtn = document.getElementById('arc-launcher-btn');
    let isMenuOpen = false;

    if(arcContainer && launcherBtn) {
        apps.forEach((app, index) => {
            const item = document.createElement('div');
            item.className = 'arc-item';
            item.setAttribute('data-name', app.name);
            item.innerHTML = `<i class="material-icons">${app.icon}</i>`;
            item.addEventListener('click', () => { app.action(); toggleArcMenu(); });
            arcContainer.appendChild(item);
        });

        const arcItems = document.querySelectorAll('.arc-item');
        function toggleArcMenu() {
            isMenuOpen = !isMenuOpen;
            const radius = 180, startAngle = -Math.PI / 2.5, endAngle = Math.PI / 2.5;   
            arcItems.forEach((item, i) => {
                if (isMenuOpen) {
                    const angle = startAngle + (i * (endAngle - startAngle) / (apps.length - 1));
                    const x = -Math.cos(angle) * radius, y = Math.sin(angle) * radius;
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = `translate(${x}px, ${y + 275}px) scale(1)`;
                    }, i * 50); 
                    launcherBtn.innerHTML = '<i class="material-icons" style="font-size: 32px;">close</i>';
                    launcherBtn.style.color = '#ff5f56'; launcherBtn.style.borderColor = '#ff5f56';
                } else {
                    setTimeout(() => {
                        item.style.opacity = '0';
                        item.style.transform = `translate(0px, 275px) scale(0)`;
                    }, (apps.length - 1 - i) * 30); 
                    launcherBtn.innerHTML = '<i class="material-icons" style="font-size: 32px;">apps</i>';
                    launcherBtn.style.color = 'var(--main-cyan)'; launcherBtn.style.borderColor = 'var(--main-cyan)';
                }
            });
        }
        launcherBtn.addEventListener('click', toggleArcMenu);
    }
    
    if(window.WindowManager) {
        const originalCreateWindow = window.WindowManager.createWindow.bind(window.WindowManager);
        window.WindowManager.createWindow = function(title, content, options = {}) {
            const win = originalCreateWindow(title, content, options);
            win.style.opacity = 0; win.style.transform += ' scale(0.9)';
            win.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
            setTimeout(() => { win.style.opacity = 1; win.style.transform = win.style.transform.replace(' scale(0.9)', ''); }, 10);
            return win;
        };
    }
});
