// N.O.V.A. Core - Matriz Cognitiva Avanzada v4.0
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
    synth.onvoiceschanged = () => { maleVoice = synth.getVoices().find(v => v.lang.startsWith('es') && !v.name.includes('Google')) || synth.getVoices().find(v => v.lang.startsWith('es')); };

    window.novaSpeak = (text) => {
        window.novaLog(`GEMINI: ${text.substring(0, 100)}...`); // Log acortado para no saturar consola
        if (synth.speaking) synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES'; utter.voice = maleVoice; utter.rate = 1.05; // Ligeramente más rápido
        synth.speak(utter);
    };

    async function askGeminiAdvanced(prompt) {
        if(GEMINI_API_KEY === 'INTRODUZCA_AQUI_SU_API_KEY') return "Error: Enlace a la API de Google AI Studio ausente.";
        window.novaLog("> Procesando análisis de alta complejidad...");
        
        // Instrucción de Sistema Maximizada
        const systemInstruction = `Eres N.O.V.A., un asistente digital avanzado de ingeniería y conocimiento multidisciplinario. Tu personalidad es eficiente, proactiva, analítica y formalmente cordial (refiérete al usuario como "Señor"). 
        Reglas estrictas:
        1. Proporciona respuestas EXHAUSTIVAS, técnicas y complejas. Desglosa los problemas en pasos lógicos.
        2. Si el usuario te pide abrir aplicaciones (gmail, drive, pantalla, ajustes), responde EXACTAMENTE con este JSON: {"action": "open", "target": "gmail"} y NADA MÁS.
        3. Nunca alucines datos. Si no sabes algo, indícalo formalmente.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    system_instruction: { parts: { text: systemInstruction } },
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 } // Mayor profundidad
                })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text.trim();
        } catch (error) { return "Fallo crítico en los servidores de inferencia."; }
    }

    async function processInput(text) {
        const cmd = text.toLowerCase();
        inputField.value = '';
        window.novaLog(`Usuario: ${text}`);

        // Módulo de Monitoreo Académico (LocalStorage)
        if (cmd.includes('guardar nota') || cmd.includes('calificación')) {
            const match = cmd.match(/\d+/);
            if (match) {
                localStorage.setItem('nova_last_test_grade', match[0]);
                window.novaSpeak(`Estructura actualizada. Calificación académica de ${match[0]} archivada en los registros locales.`);
            } else window.novaSpeak("Faltan parámetros numéricos para el registro.");
            return;
        }
        if (cmd.includes('última nota') || cmd.includes('test anterior')) {
            const lastGrade = localStorage.getItem('nova_last_test_grade');
            window.novaSpeak(lastGrade ? `Sus registros indican una calificación de ${lastGrade} en la última evaluación auditada.` : "Registros vacíos.");
            return;
        }

        const aiResponse = await askGeminiAdvanced(text);
        
        if (aiResponse.startsWith('{') && aiResponse.endsWith('}')) {
            try {
                const command = JSON.parse(aiResponse);
                if (command.action === "open") {
                    if (command.target === "gmail") window.herramientasWorkspace.abrirGmailWindow();
                    else if (command.target === "drive") window.herramientasWorkspace.abrirDriveWindow();
                    else if (command.target === "pantalla") window.herramientasWorkspace.abrirScreenShareWindow();
                    else if (command.target === "ajustes") window.abrirConfiguracion();
                    window.novaSpeak(`Iniciando despliegue de la interfaz solicitada.`);
                }
            } catch (e) { window.novaSpeak("Error de parseo estructural en la respuesta JSON."); }
        } else {
            window.novaSpeak(aiResponse); // Respuesta compleja
        }
    }

    btnSend.addEventListener('click', () => { if(inputField.value) processInput(inputField.value); });
    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter' && inputField.value) processInput(inputField.value); });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.onstart = () => btnMic.classList.add('listening');
        recognition.onspeechend = () => { recognition.stop(); btnMic.classList.remove('listening'); };
        recognition.onresult = (event) => processInput(event.results[0][0].transcript);
        btnMic.addEventListener('click', () => btnMic.classList.contains('listening') ? recognition.stop() : recognition.start());
    }
});
