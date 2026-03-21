// Protocolo de Integración Google Workspace & Screen Share (N-OS Módulos Activos v4.1 - Corregido)

const CLIENT_ID = '790599911679-1o8rufmv9p6u3vvqebgq6lcvq2bqbifi.apps.googleusercontent.com';
// Scopes elevados a nivel de Modificación/Escritura
const SCOPES = 'https://www.googleapis.com/auth/drive https://mail.google.com/ https://www.googleapis.com/auth/calendar';

let tokenClient;
let gapiInited = false;
let gisinited = false;

function gapiLoaded() { gapi.load('client', initializeGapiClient); }

async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://gmail.googleapis.com/$discovery/rest?version=v1'
        ],
    });
    gapiInited = true;
    if (window.novaLog) window.novaLog("> N-OS: Kernels de Google API listos.");
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', 
    });
    gisinited = true;
}

window.iniciarAutenticacionGoogle = function() {
    if (!tokenClient && typeof google !== 'undefined') gisLoaded();
    if (!tokenClient) {
        if (window.novaLog) window.novaLog("ERROR: Las librerías de Google no están listas aún.");
        return;
    }

    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) throw (resp);
        if (window.novaLog) window.novaLog("> Ecosistema Google enlazado. Permisos de escritura concedidos.");
        if (window.novaSpeak) window.novaSpeak("Privilegios elevados. Acceso total a su ecosistema concedido, Señor.");
        
        // Recargar la ventana de configuración si está abierta para actualizar el LED a verde
        if (window.abrirConfiguracion) window.abrirConfiguracion();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
};

window.herramientasWorkspace = {
    
    // MÓDULO GMAIL (Interfaz Avanzada Interactiva)
    abrirGmailWindow: async function() {
        const frame = document.createElement('div');
        frame.className = 'google-sim-frame'; 
        frame.style.overflow = 'auto'; 
        frame.style.background = '#f4f7f6';
        frame.innerHTML = `<div style="padding:20px; color:#1a73e8; text-align:center;">Sincronizando con matriz de correo...</div>`;
        window.WindowManager.createWindow('Terminal de Comunicaciones Seguras', frame, {w: 650, h: 550, y: 50});
        
        try {
            if (gapiInited && gapi.client.getToken()) {
                const response = await gapi.client.gmail.users.messages.list({ 'userId': 'me', 'maxResults': 5 });
                let htmlContent = `<div style="padding: 15px; background: #fff; border-bottom: 2px solid #ea4335; position: sticky; top: 0; z-index: 10;">
                    <h3 style="margin:0; color:#202124;"><i class="material-icons" style="vertical-align: middle;">mail</i> Bandeja de Entrada</h3>
                </div><div style="padding: 15px;">`;

                for (const msg of response.result.messages) {
                    const msgData = await gapi.client.gmail.users.messages.get({ 'userId': 'me', 'id': msg.id });
                    const headers = msgData.result.payload.headers;
                    const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
                    const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
                    const date = headers.find(h => h.name === 'Date')?.value || '';
                    
                    htmlContent += `
                        <div style="background:#fff; padding:15px; border-radius:8px; border: 1px solid #dadce0; margin-bottom:15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                                <div><strong style="color:#202124;">${from.replace(/<.*>/, '')}</strong> <br>
                                <span style="font-size:0.8rem; color:#5f6368;">${date.substring(0, 22)}</span></div>
                            </div>
                            <h4 style="margin: 0 0 10px 0; color:#1a73e8;">${subject}</h4>
                            <div style="color:#3c4043; font-size: 0.9em; margin-bottom: 15px;">${msgData.result.snippet}...</div>
                            <div style="display:flex; gap:10px; border-top: 1px solid #eee; padding-top: 10px;">
                                <button onclick="window.novaSpeak('Comando de respuesta interceptado. Requiere despliegue del teclado virtual.')" style="background:#1a73e8; color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;">Responder</button>
                                <button onclick="this.parentElement.parentElement.style.display='none'; window.novaSpeak('Mensaje archivado en la matriz.')" style="background:#fff; color:#5f6368; border:1px solid #dadce0; padding:5px 15px; border-radius:4px; cursor:pointer;">Archivar</button>
                            </div>
                        </div>`;
                }
                frame.innerHTML = htmlContent + `</div>`;
            } else { 
                frame.innerHTML = `<div style="color:#ff5f56; padding:20px; text-align:center; font-weight:bold;">Acceso Denegado. Abra los Ajustes y enlace su cuenta de Google.</div>`; 
            }
        } catch (err) { frame.innerHTML = `<div style="color:red; padding:20px;">Error de sincronización: ${err.message}</div>`; }
    },

    // MÓDULO DRIVE (Interfaz Avanzada Interactiva)
    abrirDriveWindow: async function() {
        const frame = document.createElement('div'); 
        frame.className = 'google-sim-frame'; 
        frame.style.overflow = 'auto'; 
        frame.style.background = '#fff';
        window.WindowManager.createWindow('Google Drive Explorer', frame, {w: 500, h: 450, x: 200, y: 150});
        
        try {
            if (gapiInited && gapi.client.getToken()) {
                const response = await gapi.client.drive.files.list({ 
                    'pageSize': 15, 
                    'fields': 'files(id, name, mimeType, modifiedTime, size)', 
                    'q': "mimeType != 'application/vnd.google-apps.folder'" 
                });
                let items = `<div style="padding: 15px; background: #f8f9fa; border-bottom: 2px solid #1a73e8; position: sticky; top: 0;">
                    <h3 style="margin:0; color:#202124;"><i class="material-icons" style="vertical-align: middle;">storage</i> Almacenamiento Estructural</h3>
                </div><div style="padding: 10px;">`;
                
                response.result.files.forEach(f => {
                    const sizeMB = f.size ? (f.size / 1048576).toFixed(2) + ' MB' : '--';
                    let icon = 'insert_drive_file';
                    if(f.name.includes('.stl') || f.name.includes('.fbx') || f.name.includes('.glb')) icon = 'view_in_ar';
                    
                    items += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee;">
                        <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                            <i class="material-icons" style="color:#5f6368;">${icon}</i>
                            <div style="overflow:hidden;">
                                <div style="font-weight:bold; color:#202124; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${f.name}</div>
                                <div style="font-size:0.75rem; color:#80868b;">Modificado: ${new Date(f.modifiedTime).toLocaleDateString()} | Tamaño: ${sizeMB}</div>
                            </div>
                        </div>
                        <button onclick="window.novaSpeak('Analizando metadatos del archivo: ${f.name}');" style="background:transparent; border:none; color:#1a73e8; cursor:pointer;"><i class="material-icons">info</i></button>
                    </div>`;
                });
                frame.innerHTML = items + `</div>`;
            } else { 
                frame.innerHTML = `<div style="color:#ff5f56; padding:20px; text-align:center; font-weight:bold;">Acceso Denegado. Abra los Ajustes y enlace su cuenta de Google.</div>`; 
            }
        } catch (err) { frame.innerHTML = `<div style="color:red; padding:20px;">Error: ${err.message}</div>`; }
    },

    abrirScreenShareWindow: async function() {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
            const video = document.createElement('video'); 
            video.autoplay = true; 
            video.srcObject = mediaStream; 
            video.style.width = '100%'; 
            video.style.height = '100%'; 
            video.style.objectFit = 'contain'; 
            video.style.background = '#000';
            const win = window.WindowManager.createWindow('Monitor de Telemetría', video, {w: 700, h: 500});
            win.querySelector('.win-close').addEventListener('click', () => mediaStream.getTracks().forEach(t => t.stop()));
        } catch (err) { console.error(err); }
    }
};

// --- MÓDULO DE AJUSTES DEL SISTEMA N-OS (RESTAURADO) ---
window.abrirConfiguracion = function() {
    const hasToken = (typeof gapi !== 'undefined' && gapi.client && gapi.client.getToken() !== null);
    const lastGrade = localStorage.getItem('nova_last_test_grade') || 'Sin registros';

    const configHTML = `
        <style>
            .config-container { padding: 15px; color: #fff; font-family: 'Segoe UI', sans-serif; height: 100%; box-sizing: border-box; }
            .config-section { margin-bottom: 20px; border-bottom: 1px solid rgba(79, 172, 254, 0.3); padding-bottom: 15px; }
            .config-title { font-size: 1.1rem; color: var(--main-cyan); margin-bottom: 15px; display:flex; align-items:center; gap:8px; text-transform: uppercase; letter-spacing: 1px;}
            .config-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; font-size: 0.9rem;}
            .config-btn { background: rgba(0, 0, 0, 0.5); border: 1px solid var(--main-cyan); color: var(--main-cyan); padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: 0.3s; font-weight: bold;}
            .config-btn:hover { background: var(--main-cyan); color: #000; box-shadow: 0 0 15px var(--glow-cyan); }
            
            .led-indicator { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 5px; }
            .led-offline { background: #ff5f56; box-shadow: 0 0 8px #ff5f56; }
            .led-online { background: #00ff88; box-shadow: 0 0 8px #00ff88; }
        </style>

        <div class="config-container">
            <div class="config-section">
                <div class="config-title"><i class="material-icons">security</i> Privilegios de Red</div>
                
                <div class="config-item">
                    <span>
                        <span class="led-indicator ${hasToken ? 'led-online' : 'led-offline'}"></span>
                        Estado OAuth 2.0 (Google)
                    </span>
                    <span style="color: ${hasToken ? '#00ff88' : '#ff5f56'};">${hasToken ? 'Sincronizado' : 'Desconectado'}</span>
                </div>
                
                <div class="config-item">
                    <span style="color: #aaa; font-size: 0.8rem; max-width: 60%;">Requiere autorización de lectura/escritura para Gmail y Drive.</span>
                    <button class="config-btn" onclick="iniciarAutenticacionGoogle();">
                        ${hasToken ? 'Renovar Token' : 'Enlazar Cuenta'}
                    </button>
                </div>
            </div>

            <div class="config-section">
                <div class="config-title"><i class="material-icons">storage</i> Memoria Local</div>
                
                <div class="config-item">
                    <span>Última Calificación Académica:</span>
                    <span style="color: #00ff88; font-weight: bold; font-size: 1.1rem;">${lastGrade}</span>
                </div>
                
                <div class="config-item">
                    <span>Motor Cognitivo Activo:</span>
                    <span style="color: var(--main-cyan);">Gemini API</span>
                </div>
            </div>
        </div>
    `;

    const frame = document.createElement('div');
    frame.style.width = '100%'; frame.style.height = '100%';
    frame.style.background = 'rgba(5, 8, 15, 0.95)';
    frame.innerHTML = configHTML;
    
    // Evitar abrir múltiples ventanas de configuración
    const existingWindows = document.querySelectorAll('.window-title');
    existingWindows.forEach(title => {
        if (title.textContent === 'Configuración del Sistema') {
            title.closest('.n-os-window').remove();
        }
    });

    window.WindowManager.createWindow('Configuración del Sistema', frame, {w: 480, h: 420, x: window.innerWidth/2 - 240, y: 100});
};

// Carga asíncrona de librerías
setTimeout(() => {
    if (typeof gapi !== 'undefined' && !gapiInited) gapiLoaded();
    if (typeof google !== 'undefined' && !gisinited) gisLoaded();
}, 1000);
