// Protocolo de Integración Google Workspace & Screen Share (N-OS Módulos Activos)

// Credenciales oficiales integradas
const CLIENT_ID = '790599911679-1o8rufmv9p6u3vvqebgq6lcvq2bqbifi.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly';

let tokenClient;
let gapiInited = false;
let gisinited = false;

// Inicialización asíncrona de las librerías de Google
function gapiLoaded() { gapi.load('client', initializeGapiClient); }

async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://gmail.googleapis.com/$discovery/rest?version=v1'
        ],
    });
    gapiInited = true;
    if (window.novaLog) window.novaLog("> N-OS: Google APIs Kernels cargados y listos.");
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', 
    });
    gisinited = true;
}

// Botón de Enlace en Taskbar
window.iniciarAutenticacionGoogle = function() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            if (window.novaLog) window.novaLog(`ERROR OAuth: ${resp.error}`);
            throw (resp);
        }
        if (window.novaLog) window.novaLog("> Ecosistema Google enlazado con éxito. Permisos OAuth 2.0 concedidos.");
        if (window.novaSpeak) window.novaSpeak("Autenticación completa, Señor. N.O.V.A. posee ahora acceso analítico real a su bandeja de entrada y repositorios en la nube.");
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
};

// --- MÓDULOS OPERATIVOS DE VENTANAS N-OS ---

window.herramientasWorkspace = {
    
    // MÓDULO GMAIL (Extracción Real)
    abrirGmailWindow: async function() {
        let mailsHTML = '';
        
        try {
            if (gapiInited && gapi.client.getToken()) {
                window.novaLog("> Consultando servidores de Gmail...");
                const response = await gapi.client.gmail.users.messages.list({ 'userId': 'me', 'maxResults': 5 });
                const messages = response.result.messages;
                
                mailsHTML = `<div class="google-sim-header" style="color:var(--main-cyan)">Bandeja de Entrada (En Vivo)</div>`;
                
                if (!messages || messages.length == 0) {
                    mailsHTML += '<div class="google-sim-item">Bandeja de entrada limpia, Señor.</div>';
                } else {
                    // Extraer los "Snippets" (resúmenes) de los correos reales
                    for (const msg of messages) {
                        const msgData = await gapi.client.gmail.users.messages.get({ 'userId': 'me', 'id': msg.id });
                        const snippet = msgData.result.snippet;
                        mailsHTML += `<div class="google-sim-item">> ${snippet.substring(0, 60)}...</div>`;
                    }
                }
            } else {
                mailsHTML = `
                    <div class="google-sim-header">Acceso Denegado</div>
                    <div class="google-sim-item" style="color:#ff5f56">> Requerido: Pulse 'ENLAZAR' en la barra de tareas para conceder permisos OAuth 2.0 antes de consultar el correo.</div>
                `;
            }

            const frame = document.createElement('div');
            frame.className = 'google-sim-frame';
            frame.innerHTML = mailsHTML;
            window.WindowManager.createWindow('Gmail Kernel Viewer', frame, {w: 450, h: 350, y: 100});

        } catch (err) { 
            console.error(err);
            window.novaLog(`ERROR en Kernel Gmail: ${err.message}`);
        }
    },

    // MÓDULO DRIVE (Extracción Real)
    abrirDriveWindow: async function() {
        let driveHTML = '';
        
        try {
            if (gapiInited && gapi.client.getToken()) {
                window.novaLog("> Escaneando Google Drive en busca de archivos CAD...");
                // Buscar archivos STL en la cuenta real
                const response = await gapi.client.drive.files.list({
                    'pageSize': 10,
                    'fields': 'files(id, name, mimeType)',
                    'q': "name contains '.stl' or name contains '.pdf'"
                });
                const files = response.result.files;
                
                driveHTML = `<div class="google-sim-header" style="color:var(--main-cyan)">Google Drive Workspace (En Vivo)</div>`;
                
                if (files && files.length > 0) {
                    files.forEach(file => {
                        driveHTML += `<div class="google-sim-item">├── ${file.name}</div>`;
                    });
                } else {
                    driveHTML += `<div class="google-sim-item">No se han detectado archivos de ingeniería compatibles recientes.</div>`;
                }
            } else {
                driveHTML = `
                    <div class="google-sim-header">Acceso Denegado</div>
                    <div class="google-sim-item" style="color:#ff5f56">> Requerido: Pulse 'ENLAZAR' en la barra de tareas para escanear su unidad en la nube.</div>
                `;
            }

            const frame = document.createElement('div');
            frame.className = 'google-sim-frame';
            frame.style.background = '#eef2f5';
            frame.innerHTML = driveHTML;
            window.WindowManager.createWindow('Google Drive Explorer', frame, {w: 400, h: 300, x: 200, y: 150});

        } catch (err) {
            console.error(err);
            window.novaLog(`ERROR en Kernel Drive: ${err.message}`);
        }
    },

    // MÓDULO SCREEN SHARE (Acceso en directo)
    abrirScreenShareWindow: async function() {
        try {
            window.novaLog("> Solicitando acceso a MediaDevices nativos...");
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            });

            const video = document.createElement('video');
            video.id = 'screen-share-video';
            video.autoplay = true;
            video.playsInline = true;
            video.srcObject = mediaStream;

            const win = window.WindowManager.createWindow('Monitor de Telemetría (Pantalla Directo)', video, {w: 640, h: 480});
            if (window.novaSpeak) window.novaSpeak("Conexión estructuralizada. Desplegando acceso en directo a su telemetría principal, Señor.");

            const closeBtn = win.querySelector('.win-close');
            closeBtn.addEventListener('click', () => {
                mediaStream.getTracks().forEach(track => track.stop());
                video.srcObject = null;
                window.novaLog("> Acceso de telemetría finalizado.");
            });

        } catch (err) {
            console.error(err);
            window.novaLog(`ERROR CRÍTICO: Fallo al acceder a la pantalla: ${err.message}.`);
            if (window.novaSpeak) window.novaSpeak("Permisos de captura de pantalla denegados por el sistema anfitrión.");
        }
    }
};

// Disparadores de carga de Google
if (typeof gapi !== 'undefined') gapiLoaded();
if (typeof google !== 'undefined') gisLoaded();
