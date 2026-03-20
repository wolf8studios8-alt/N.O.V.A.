// N.O.V.A. Core - Integración Gemini API
// REQUIERE SU CLAVE DE API DE GOOGLE AI STUDIO PARA RESPUESTAS DINÁMICAS
const GEMINI_API_KEY = 'INTRODUZCA_AQUI_SU_API_KEY'; 

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('cmd-input');
    const btnSend = document.getElementById('btn-send');
    const btnMic = document.getElementById('btn-mic');
    window.statusConsole = document.getElementById('status-console');

    window.novaLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        window.statusConsole.innerHTML += `<div><span style="color:#888">[${time}]</span> ${msg}</div>`;
        window.statusConsole.scrollTop = window.statusConsole.scrollHeight;
    };

    const synth = window.speechSynthesis;
    let maleVoice = null;
    synth.onvoiceschanged = () => {
        maleVoice = synth.getVoices().find(v => v.lang.startsWith('es') && !v.name.includes('Google')) 
                 || synth.getVoices().find(v => v.lang.startsWith('es'));
    };

    window.novaSpeak = (text) => {
        window.novaLog(`GEMINI: ${text}`);
        if (synth.speaking) synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES'; utter.voice = maleVoice; utter.rate = 1.0;
        synth.speak(utter);
    };

    // --- CONEXIÓN A GEMINI API ---
    async function askGemini(prompt) {
        if(GEMINI_API_KEY === 'INTRODUZCA_AQUI_SU_API_KEY') {
            return "Señor, mis capacidades cognitivas están limitadas sin una clave API de Gemini válida. Procesando mediante comandos locales.";
        }
        
        window.novaLog("> Conectando con los servidores de inferencia de Gemini...");
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: `Eres N.O.V.A., un asistente de ingeniería operado por Gemini. Responde de forma formal, analítica y concisa. Usuario dice: ${prompt}` }] }] })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error(error);
            return "Error de red al intentar contactar con la matriz de Gemini.";
        }
    }

    // --- PROCESAMIENTO CENTRAL ---
    async function processInput(text) {
        const cmd = text.toLowerCase();
        inputField.value = '';
        window.novaLog(`Usuario: ${text}`);

        // 1. Módulo de Rúbricas (Requisito Estructural LocalStorage)
        if (cmd.includes('guardar nota') || cmd.includes('calificación')) {
            const match = cmd.match(/\d+/);
            if (match) {
                localStorage.setItem('nova_last_test_grade', match[0]);
                window.novaSpeak(`Directiva ejecutada. La calificación de ${match[0]} ha sido almacenada mediante tecnología LocalStorage para su seguimiento académico.`);
            } else window.novaSpeak("No he detectado parámetros numéricos en su directiva.");
            return;
        }
        if (cmd.includes('última nota') || cmd.includes('test anterior')) {
            const lastGrade = localStorage.getItem('nova_last_test_grade');
            window.novaSpeak(lastGrade ? `Recuperando base de datos local. Su rendimiento en la última prueba fue de ${lastGrade}. Confirmado que el registro es correcto.` : "El registro académico está vacío, Señor.");
            return;
        }

        // 2. Comandos de Ecosistema N-OS
        if (cmd.includes('gmail') || cmd.includes('correo')) { window.herramientasWorkspace.abrirGmailWindow(); return; }
        if (cmd.includes('drive')) { window.herramientasWorkspace.abrirDriveWindow(); return; }
        if (cmd.includes('pantalla')) { window.herramientasWorkspace.abrirScreenShareWindow(); return; }

        // 3. Fallback a Gemini AI
        const aiResponse = await askGemini(text);
        window.novaSpeak(aiResponse);
    }

    // --- EVENTOS INTERFAZ ---
    btnSend.addEventListener('click', () => { if(inputField.value) processInput(inputField.value); });
    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter' && inputField.value) processInput(inputField.value); });

    // API de Voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.onstart = () => btnMic.classList.add('listening');
        recognition.onspeechend = () => { recognition.stop(); btnMic.classList.remove('listening'); };
        recognition.onresult = (event) => processInput(event.results[0][0].transcript);
        btnMic.addEventListener('click', () => btnMic.classList.contains('listening') ? recognition.stop() : recognition.start());
    }

    setTimeout(() => window.novaSpeak("Matriz cognitiva Gemini y panel de comandos integrados. Esperando directivas, Señor."), 1000);
});
