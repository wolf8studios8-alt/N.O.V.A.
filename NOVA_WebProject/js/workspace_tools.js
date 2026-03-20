window.herramientasWorkspace = {
    abrirGmailWindow: async function() {
        const frame = document.createElement('div');
        frame.className = 'google-sim-frame'; frame.style.overflow = 'auto'; frame.style.background = '#f4f7f6';
        frame.innerHTML = `<div style="padding:20px; color:#1a73e8; text-align:center;"><div class="led-indicator led-online"></div> Sincronizando con matriz de correo...</div>`;
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
                        <div style="background:#fff; padding:15px; border-radius:8px; border: 1px solid #dadce0; margin-bottom:15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: 0.2s;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                                <div><strong style="color:#202124;">${from.replace(/<.*>/, '')}</strong> <br>
                                <span style="font-size:0.8rem; color:#5f6368;">${date.substring(0, 22)}</span></div>
                            </div>
                            <h4 style="margin: 0 0 10px 0; color:#1a73e8;">${subject}</h4>
                            <div style="color:#3c4043; font-size: 0.9em; margin-bottom: 15px;">${msgData.result.snippet}...</div>
                            <div style="display:flex; gap:10px; border-top: 1px solid #eee; padding-top: 10px;">
                                <button onclick="window.novaSpeak('Comando de respuesta interceptado. Requiere confirmación de salida.')" style="background:#1a73e8; color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;">Responder</button>
                                <button onclick="this.parentElement.parentElement.style.display='none'; window.novaSpeak('Mensaje archivado en la matriz local.')" style="background:#fff; color:#5f6368; border:1px solid #dadce0; padding:5px 15px; border-radius:4px; cursor:pointer;">Archivar</button>
                            </div>
                        </div>`;
                }
                frame.innerHTML = htmlContent + `</div>`;
            } else { frame.innerHTML = `<div style="color:red; padding:20px;">Requiere enlace en Ajustes.</div>`; }
        } catch (err) { frame.innerHTML = `Error de sincronización: ${err.message}`; }
    },

    abrirDriveWindow: async function() {
        const frame = document.createElement('div'); frame.className = 'google-sim-frame'; frame.style.overflow = 'auto'; frame.style.background = '#fff';
        window.WindowManager.createWindow('Google Drive Explorer', frame, {w: 500, h: 450, x: 200, y: 150});
        try {
            if (gapiInited && gapi.client.getToken()) {
                const response = await gapi.client.drive.files.list({ 
                    'pageSize': 10, 
                    'fields': 'files(id, name, mimeType, modifiedTime, size)', 
                    'q': "mimeType != 'application/vnd.google-apps.folder'" 
                });
                let items = `<div style="padding: 15px; background: #f8f9fa; border-bottom: 2px solid #1a73e8; position: sticky; top: 0;">
                    <h3 style="margin:0; color:#202124;"><i class="material-icons" style="vertical-align: middle;">storage</i> Almacenamiento Estructural</h3>
                </div><div style="padding: 10px;">`;
                
                response.result.files.forEach(f => {
                    const sizeMB = f.size ? (f.size / 1048576).toFixed(2) + ' MB' : '--';
                    items += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee; hover:background:#f1f3f4;">
                        <div style="flex-grow:1; overflow:hidden;">
                            <div style="font-weight:bold; color:#202124; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${f.name}</div>
                            <div style="font-size:0.75rem; color:#80868b;">Modificado: ${new Date(f.modifiedTime).toLocaleDateString()} | Tamaño: ${sizeMB}</div>
                        </div>
                        <button onclick="window.novaSpeak('Analizando metadatos del archivo ${f.name}...');" style="background:transparent; border:none; color:#1a73e8; cursor:pointer;"><i class="material-icons">info</i></button>
                    </div>`;
                });
                frame.innerHTML = items + `</div>`;
            } else { frame.innerHTML = `<div style="color:red; padding:20px;">Requiere enlace en Ajustes.</div>`; }
        } catch (err) { frame.innerHTML = `Error: ${err.message}`; }
    },

    abrirScreenShareWindow: async function() {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
            const video = document.createElement('video'); video.autoplay = true; video.srcObject = mediaStream; video.style.width = '100%'; video.style.height = '100%'; video.style.objectFit = 'contain'; video.style.background = '#000';
            const win = window.WindowManager.createWindow('Monitor de Telemetría', video, {w: 700, h: 500});
            win.querySelector('.win-close').addEventListener('click', () => mediaStream.getTracks().forEach(t => t.stop()));
        } catch (err) { console.error(err); }
    }
};
