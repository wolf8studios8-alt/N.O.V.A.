const CLIENT_ID = '790599911679-1o8rufmv9p6u3vvqebgq6lcvq2bqbifi.apps.googleusercontent.com';
// ATENCIÓN: Scopes elevados a nivel de Modificación/Escritura.
const SCOPES = 'https://www.googleapis.com/auth/drive https://mail.google.com/ https://www.googleapis.com/auth/calendar';

let tokenClient; let gapiInited = false; let gisinited = false;
function gapiLoaded() { gapi.load('client', initializeGapiClient); }
async function initializeGapiClient() {
    await gapi.client.init({ discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest', 'https://gmail.googleapis.com/$discovery/rest?version=v1'] });
    gapiInited = true;
}
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPES, callback: '' });
    gisinited = true;
}

window.iniciarAutenticacionGoogle = function() {
    if (!tokenClient && typeof google !== 'undefined') gisLoaded();
    if (!tokenClient) return;
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) throw (resp);
        if (window.novaSpeak) window.novaSpeak("Privilegios elevados. Acceso de escritura concedido.");
    };
    if (gapi.client.getToken() === null) tokenClient.requestAccessToken({prompt: 'consent'});
    else tokenClient.requestAccessToken({prompt: ''});
};

window.herramientasWorkspace = {
    abrirGmailWindow: async function() {
        const frame = document.createElement('div');
        frame.className = 'google-sim-frame'; frame.style.overflow = 'auto';
        frame.innerHTML = `<div style="padding:20px;">Accediendo a la matriz de correos...</div>`;
        window.WindowManager.createWindow('Terminal de Comunicaciones', frame, {w: 500, h: 400, y: 100});
        
        try {
            if (gapiInited && gapi.client.getToken()) {
                const response = await gapi.client.gmail.users.messages.list({ 'userId': 'me', 'maxResults': 4 });
                const messages = response.result.messages;
                let htmlContent = '';
                for (const msg of messages) {
                    const msgData = await gapi.client.gmail.users.messages.get({ 'userId': 'me', 'id': msg.id });
                    const subject = msgData.result.payload.headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
                    htmlContent += `<div style="background:#f1f3f4; padding:10px; border-radius:4px; margin-bottom:5px; color:#000;"><strong>${subject}</strong><br><small>${msgData.result.snippet}</small></div>`;
                }
                frame.innerHTML = htmlContent;
            } else { frame.innerHTML = `<div style="color:red; padding:20px;">Requiere enlace en Ajustes.</div>`; }
        } catch (err) { frame.innerHTML = `Error: ${err.message}`; }
    },
    abrirDriveWindow: async function() {
        const frame = document.createElement('div'); frame.className = 'google-sim-frame'; frame.style.overflow = 'auto';
        window.WindowManager.createWindow('Google Drive Explorer', frame, {w: 450, h: 350, x: 200, y: 150});
        try {
            if (gapiInited && gapi.client.getToken()) {
                const response = await gapi.client.drive.files.list({ 'pageSize': 8, 'fields': 'files(name)', 'q': "mimeType != 'application/vnd.google-apps.folder'" });
                let items = ''; response.result.files.forEach(f => items += `<div style="padding:5px; border-bottom:1px solid #ccc; color:#000;">${f.name}</div>`);
                frame.innerHTML = items;
            } else { frame.innerHTML = `<div style="color:red; padding:20px;">Requiere enlace en Ajustes.</div>`; }
        } catch (err) { frame.innerHTML = `Error: ${err.message}`; }
    },
    abrirScreenShareWindow: async function() {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
            const video = document.createElement('video'); video.autoplay = true; video.srcObject = mediaStream; video.style.width = '100%';
            const win = window.WindowManager.createWindow('Monitor de Telemetría', video, {w: 640, h: 480});
            win.querySelector('.win-close').addEventListener('click', () => mediaStream.getTracks().forEach(t => t.stop()));
        } catch (err) { console.error(err); }
    }
};

window.abrirConfiguracion = function() {
    const hasToken = (typeof gapi !== 'undefined' && gapi.client && gapi.client.getToken() !== null);
    const lastGrade = localStorage.getItem('nova_last_test_grade') || 'Sin registros';
    const configHTML = `
        <div style="padding: 15px; color: #fff; font-family: sans-serif;">
            <h3 style="color: var(--main-cyan);">Privilegios de Red</h3>
            <p>Estado OAuth: ${hasToken ? '<span style="color:#00ff88">Sincronizado (Lectura/Escritura)</span>' : '<span style="color:#ff5f56">Desconectado</span>'}</p>
            <button style="background: var(--main-cyan); border:none; padding:8px; border-radius:4px; cursor:pointer;" onclick="iniciarAutenticacionGoogle();">Enlazar Cuenta</button>
            <h3 style="color: var(--main-cyan); margin-top:20px;">Memoria Local</h3>
            <p>Última Calificación: <strong style="color:#00ff88;">${lastGrade}</strong></p>
        </div>`;
    const frame = document.createElement('div'); frame.style.width = '100%'; frame.style.height = '100%'; frame.style.background = 'rgba(5, 8, 15, 0.95)'; frame.innerHTML = configHTML;
    window.WindowManager.createWindow('Configuración del Sistema', frame, {w: 400, h: 350, x: 100, y: 100});
};

setTimeout(() => {
    if (typeof gapi !== 'undefined' && !gapiInited) gapiLoaded();
    if (typeof google !== 'undefined' && !gisinited) gisLoaded();
}, 1000);
