// Ruta: /NOVA_WebProject/js/jarvis_core.js

document.addEventListener('DOMContentLoaded', () => {
    const btnMic = document.getElementById('btn-mic');
    const statusLog = document.getElementById('status-log');
    
    // --- INICIALIZACIÓN DE SISTEMAS DE VOZ ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES'; // Español neutro
        recognition.continuous = false;
        recognition.interimResults = false;
    } else {
        logToTerminal("ERROR: El navegador actual no soporta la Web Speech API. Sugiero utilizar Chrome o Edge.");
        btnMic.disabled = true;
        return;
    }

    const synth = window.speechSynthesis;

    // --- FUNCIONES DE INTERFAZ ---
    function logToTerminal(message) {
        const time = new Date().toLocaleTimeString();
        statusLog.innerHTML += `[${time}] ${message}<br>`;
        statusLog.scrollTop = statusLog.scrollHeight;
    }

    function speak(text) {
        if (synth.speaking) {
            console.error('N.O.V.A. ya está transmitiendo audio.');
            return;
        }
        logToTerminal(`N.O.V.A.: ${text}`);
        
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.lang = 'es-ES';
        utterThis.rate = 1.0; // Tono calmado y formal
        utterThis.pitch = 0.9; 
        
        synth.speak(utterThis);
    }

    // --- CEREBRO ANALÍTICO Y MEMORIA ---
    function processCommand(command) {
        const cmd = command.toLowerCase();
        
        // 1. Módulo de Evaluación y Pruebas
        if (cmd.includes('guardar nota') || cmd.includes('calificación del test')) {
            // Extraer números del comando
            const match = cmd.match(/\d+/);
            if (match) {
                const grade = match[0];
                // Utilizamos LocalStorage para almacenar automáticamente las calificaciones
                localStorage.setItem('nova_last_test_grade', grade);
                speak(`Entendido, Señor. He almacenado de forma segura la calificación de ${grade} en la memoria local para futuras referencias.`);
            } else {
                speak("Señor, no he detectado un valor numérico válido para registrar la calificación. Por favor, repita la instrucción.");
            }
            return;
        }
        
        if (cmd.includes('última nota') || cmd.includes('resultado del último test')) {
            const lastGrade = localStorage.getItem('nova_last_test_grade');
            if (lastGrade) {
                speak(`Señor, recuperando registros. La calificación obtenida en sus últimas pruebas fue de ${lastGrade}. Siempre me aseguro de que el historial sea correcto y esté a su disposición.`);
            } else {
                speak("Señor, no encuentro registros de calificaciones previas en la base de datos local.");
            }
            return;
        }

        // 2. Módulo de Ingeniería (Simulación)
        if (cmd.includes('imprimir') || cmd.includes('3d')) {
            speak("Iniciando conexión virtual con el servidor de impresión Bambu Lab. Preparando entorno para la laminación del modelo.");
            return;
        }

        // Respuesta por defecto para procesamiento LLM (Simulado para entorno Client-Side)
        speak(`He procesado su solicitud: "${command}". Dado que estamos operando en el entorno local del navegador, he encolado esta directiva para su análisis estructural.`);
    }

    // --- EVENTOS DE INTERACCIÓN ---
    recognition.onstart = function() {
        btnMic.classList.add('listening');
        btnMic.textContent = "Escuchando...";
        logToTerminal("> Micrófono activado. Esperando entrada de audio.");
    };

    recognition.onspeechend = function() {
        recognition.stop();
        btnMic.classList.remove('listening');
        btnMic.textContent = "Iniciar Reconocimiento de Voz";
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        logToTerminal(`Usuario: ${transcript}`);
        processCommand(transcript);
    };

    recognition.onerror = function(event) {
        btnMic.classList.remove('listening');
        btnMic.textContent = "Iniciar Reconocimiento de Voz";
        logToTerminal(`ERROR DE SISTEMA: ${event.error}`);
    };

    btnMic.addEventListener('click', () => {
        recognition.start();
    });

    // Saludo inicial
    setTimeout(() => {
        speak("Sistemas en línea. Interfaz táctil renderizada con éxito. A la espera de sus directivas, Señor.");
    }, 1000);
});
