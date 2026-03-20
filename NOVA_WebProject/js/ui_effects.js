// N.O.V.A. UI Effects - Cybernetic Perspective

document.addEventListener('DOMContentLoaded', () => {
    // 1. Efecto Cibernético en los Botones (Estilo profesional)
    const systemButtons = document.querySelectorAll('.btn-system');
    systemButtons.forEach(btn => {
        // Añadir una línea de escaneo sutil al hover
        btn.addEventListener('mouseover', () => {
            btn.style.boxShadow = '0 0 10px rgba(79, 172, 254, 0.4)';
        });
        btn.addEventListener('mouseout', () => {
            btn.style.boxShadow = 'none';
        });
    });

    // 2. Efecto Cibernético en las Ventanas N-OS (Interacción)
    const originalCreateWindow = window.WindowManager.createWindow.bind(window.WindowManager);
    
    // "Parcheamos" la función original para añadir efectos cibernéticos al crearse
    window.WindowManager.createWindow = function(title, content, options = {}) {
        const win = originalCreateWindow(title, content, options);
        
        // Efecto de aparición cibernética
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
