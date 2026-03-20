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
    
    // MÓDULO GMAIL (Interfaz Mejorada)
    abrirGmailWindow: async function() {
        let mailsHTML = `
            <style>
                .app-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--main-cyan); padding-bottom: 10px; margin-bottom: 15px; }
                .app-title { font-size: 1.2rem; font-weight: bold; color: var(--main-cyan); }
                .mail-card { background: #f8f9fa; border-left: 4px solid #ea4335; padding: 10px; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .mail-subject { font-weight: bold; color: #202124; margin-bottom: 5px; }
                .mail-snippet { color: #5f6368; font-size: 0.85rem; }
                .btn-open-real { background: #ea4335; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 0.8rem; }
            </style>
            <div class="app-header">
                <span class="app-title">Comunicaciones N.O.V.A.</span>
                <a href="https://mail.google.com" target="_blank" class="btn-open-real">Abrir Gmail Web</a>
            </div>
            <div id="mail-content">Cargando datos encriptados...</div>
        `;

        const frame = document.createElement('div');
        frame.className = 'google-sim-frame';
        frame.innerHTML = mailsHTML;
        const win = window.WindowManager.createWindow('Terminal de Comunicaciones', frame, {w: 500, h: 400, y: 100});
        
        const contentDiv = win.querySelector('#mail-content');

        try {
            if (gapiInited && gapi.client.getToken()) {
                const response = await gapi.client.gmail.users.messages.list({ 'userId': 'me', 'maxResults': 4 });
                const messages = response.result.messages;
                
                if (!messages || messages.length == 0) {
                    contentDiv.innerHTML = '<div class="mail-card">Bandeja de entrada despejada, Señor.</div>';
                } else {
                    let cards = '';
                    for (const msg of messages) {
                        const msgData = await gapi.client.gmail.users.messages.get({ 'userId': 'me', 'id': msg.id });
                        const headers = msgData.result.payload.headers;
                        const subjectHeader = headers.find(h => h.name === 'Subject');
                        const subject = subjectHeader ? subjectHeader.value : 'Sin Asunto';
                        const snippet = msgData.result.snippet;
                        
                        cards += `
                            <div class="mail-card">
                                <div class="mail-subject">${subject}</div>
                                <div class="mail-snippet">${snippet.substring(0, 80)}...</div>
                            </div>
                        `;
                    }
                    contentDiv.innerHTML = cards;
                }
            } else {
                contentDiv.innerHTML = `
                    <div class="mail-card" style="border-left-color: #ff5f56;">
                        <div class="mail-subject" style="color: #ff5f56;">Acceso Denegado</div>
                        <div class="mail-snippet">Debe pulsar "Enlazar Google" en la barra inferior para autorizar la extracción de datos.</div>
                    </div>
                `;
            }
        } catch (err) { 
            console.error(err);
            contentDiv.innerHTML = `<div class="mail-card">Error de conexión: ${err.message}</div>`;
        }
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
