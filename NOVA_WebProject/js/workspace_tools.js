// Protocolo de Integración Google Workspace & Screen Share (N-OS Módulos Activos v3.0)

const CLIENT_ID = '790599911679-1o8rufmv9p6u3vvqebgq6lcvq2bqbifi.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly';

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
    if (!tokenClient) return;

    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) throw (resp);
        if (window.novaLog) window.novaLog("> Ecosistema Google enlazado. Permisos concedidos.");
        if (window.novaSpeak) window.novaSpeak("Autenticación completada. Sistemas de datos sincronizados.");
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
};

window.herramientasWorkspace = {
    
    // MÓDULO GMAIL (Extracción Completa Decodificada)
    abrirGmailWindow: async function() {
        const frame = document.createElement('div');
        frame.className = 'google-sim-frame';
        frame.style.overflow = 'auto';
        frame.innerHTML = `<div style="padding:20px; color:#1a73e8;">Extrayendo y desencriptando paquetes de datos de Google Servers...</div>`;
        const win = window.WindowManager.createWindow('Terminal de Comunicaciones', frame, {w: 600, h: 500, y: 50});

        try {
            if (gapiInited && gapi.client.getToken()) {
                const response = await gapi.client.gmail.users.messages.list({ 'userId': 'me', 'maxResults': 3 });
                const messages = response.result.messages;
                let htmlContent = '<h3 style="border-bottom:2px solid #ea4335; padding-bottom:5px;">Comunicaciones Recientes</h3>';

                for (const msg of messages) {
                    const msgData = await gapi.client.gmail.users.messages.get({ 'userId': 'me', 'id': msg.id, 'format': 'full' });
                    const headers = msgData.result.payload.headers;
                    const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
                    const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
                    
                    // Decodificación Base64 URL (Estructuralmente necesario para Gmail API)
                    let bodyData = '';
                    if (msgData.result.payload.parts) {
                        const part = msgData.result.payload.parts.find(p => p.mimeType === 'text/plain');
                        if (part && part.body.data) bodyData = part.body.data;
                    } else if (msgData.result.payload.body.data) {
                        bodyData = msgData.result.payload.body.data;
                    }
                    
                    let bodyText = "Contenido no legible en texto plano.";
                    if (bodyData) {
                        bodyText = decodeURIComponent(escape(window.atob(bodyData.replace(/-/g, '+').replace(/_/g, '/'))));
                    }

                    htmlContent += `
                        <div style="background:#f1f3f4; padding:15px; border-radius:8px; margin-bottom:15px; color:#202124;">
                            <strong>De:</strong> ${from}<br>
                            <strong>Asunto:</strong> ${subject}<hr style="border:0; border-top:1px solid #dadce0;">
                            <div style="white-space: pre-wrap; font-family: monospace; font-size: 0.9em; max-height: 150px; overflow-y: auto; background:#fff; padding:10px; border:1px solid #ccc;">${bodyText}</div>
                        </div>`;
                }
                frame.innerHTML = htmlContent;
            } else {
                frame.innerHTML = `<div style="color:#ff5f56; padding:20px;">Acceso Denegado. Se requiere enlace OAuth 2.0.</div>`;
            }
        } catch (err) { frame.innerHTML = `<div style="color:red; padding:20px;">Error: ${err.message}</div>`; }
    },

    // MÓDULO DRIVE (Interfaz Mejorada)
    abrirDriveWindow: async function() {
        let driveHTML = `
            <style>
                .app-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a73e8; padding-bottom: 10px; margin-bottom: 15px; }
                .app-title { font-size: 1.2rem; font-weight: bold; color: #1a73e8; }
                .file-card { background: #f8f9fa; border: 1px solid #dadce0; padding: 10px; margin-bottom: 8px; border-radius: 6px; display: flex; align-items: center; }
                .file-icon { font-family: 'Material Icons'; margin-right: 10px; color: #5f6368; }
                .file-name { color: #202124; font-size: 0.9rem; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .btn-open-real { background: #1a73e8; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 0.8rem; }
            </style>
            <div class="app-header">
                <span class="app-title">Base de Datos de Ingeniería</span>
                <a href="https://drive.google.com" target="_blank" class="btn-open-real">Abrir Drive Web</a>
            </div>
            <div id="drive-content">Escaneando repositorios...</div>
        `;

        const frame = document.createElement('div');
        frame.className = 'google-sim-frame';
        frame.innerHTML = driveHTML;
        const win = window.WindowManager.createWindow('Google Drive Explorer', frame, {w: 450, h: 350, x: 200, y: 150});
        
        const contentDiv = win.querySelector('#drive-content');

        try {
            if (gapiInited && gapi.client.getToken()) {
                const response = await gapi.client.drive.files.list({
                    'pageSize': 8,
                    'fields': 'files(id, name, mimeType)',
                    'q': "mimeType != 'application/vnd.google-apps.folder'" // Evitar carpetas para ver archivos
                });
                const files = response.result.files;
                
                if (files && files.length > 0) {
                    let items = '';
                    files.forEach(file => {
                        let icon = 'insert_drive_file';
                        if(file.name.includes('.stl')) icon = 'view_in_ar';
                        if(file.mimeType.includes('image')) icon = 'image';
                        
                        items += `
                            <div class="file-card">
                                <span class="file-icon">${icon}</span>
                                <span class="file-name">${file.name}</span>
                            </div>
                        `;
                    });
                    contentDiv.innerHTML = items;
                } else {
                    contentDiv.innerHTML = '<div class="file-card">No hay archivos en este repositorio.</div>';
                }
            } else {
                contentDiv.innerHTML = `
                    <div class="file-card">
                        <span class="file-icon" style="color:#ff5f56;">error</span>
                        <span class="file-name" style="color:#ff5f56;">Autorización OAuth requerida para visualizar archivos.</span>
                    </div>
                `;
            }
        } catch (err) {
            console.error(err);
            contentDiv.innerHTML = `<div class="file-card">Fallo del servidor: ${err.message}</div>`;
        }
    },

    abrirScreenShareWindow: async function() {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
            const video = document.createElement('video');
            video.id = 'screen-share-video';
            video.autoplay = true;
            video.playsInline = true;
            video.srcObject = mediaStream;

            const win = window.WindowManager.createWindow('Monitor de Telemetría (Pantalla Directo)', video, {w: 640, h: 480});
            
            const closeBtn = win.querySelector('.win-close');
            closeBtn.addEventListener('click', () => {
                mediaStream.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            });
        } catch (err) { console.error(err); }
    }
};

setTimeout(() => {
    if (typeof gapi !== 'undefined' && !gapiInited) gapiLoaded();
    if (typeof google !== 'undefined' && !gisinited) gisLoaded();
}, 1000);
