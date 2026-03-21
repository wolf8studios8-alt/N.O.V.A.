// N.O.V.A. Core Intelligence

document.addEventListener('DOMContentLoaded', () => {
    const btnMic = document.getElementById('btn-mic');
    window.statusLog = document.getElementById('status-log');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;
    } else {
        novaLog("ERROR: API de voz no soportada en este navegador.");
        return;
    }

    window.novaLog = function(message) {
        const time = new Date().toLocaleTimeString();
        window.statusLog.innerHTML += `[${time}] ${message}<br>`;
        window.statusLog.scrollTop = window.statusLog.scrollHeight;
    };

    window.novaSpeak = function(text) {
        window.novaLog(`N.O.V.A.: ${text}`);
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.lang = 'es-ES';
        utterThis.rate = 1.0;
        window.speechSynthesis.speak(utterThis);
    };

    function processCommand(command) {
        const cmd = command.toLowerCase();
        
        // Módulo de Memoria y Evaluaciones
        if (cmd.includes('guardar nota') || cmd.includes('saqué un')) {
            const match = cmd.match(/\d+/);
            if (match) {
                const grade = match[0];
                localStorage.setItem('nova_last_test_grade', grade);
                novaSpeak(`Registro actualizado. He almacenado de forma segura la calificación de ${grade} en la base de datos local para sus futuras pruebas.`);
            } else {
                novaSpeak("No detecto parámetros numéricos válidos. Repita la instrucción, Señor.");
            }
            return;
        }
        
        if (cmd.includes('última nota') || cmd.includes('test anterior')) {
            const lastGrade = localStorage.getItem('nova_last_test_grade');
            if (lastGrade) {
                novaSpeak(`Recuperando archivos. La calificación que obtuvo en las últimas pruebas registradas fue de ${lastGrade}. El historial es completamente correcto.`);
            } else {
                novaSpeak("El registro de evaluaciones se encuentra vacío actualmente, Señor.");
            }
            return;
        }

        // Módulo de Ecosistema Google (Llamada a herramientas)
        if (cmd.includes('correo') || cmd.includes('gmail')) {
            novaSpeak("Iniciando escaneo de su bandeja de entrada mediante los protocolos de Google Workspace...");
            window.herramientasWorkspace.leerUltimosCorreos();
            return;
        }
        
        if (cmd.includes('drive') || cmd.includes('descargar modelo')) {
            novaSpeak("Accediendo a su unidad de Google Drive. Buscando archivos de ingeniería compatibles...");
            window.herramientasWorkspace.buscarArchivoSTL();
            return;
        }

        novaSpeak("He procesado su instrucción, pero carezco de los parámetros específicos para ejecutarla en la interfaz actual.");
    }

    recognition.onstart = () => {
        btnMic.classList.add('listening');
        btnMic.textContent = "Escuchando...";
        novaLog("> Ingreso de audio activo.");
    };

    recognition.onspeechend = () => {
        recognition.stop();
        btnMic.classList.remove('listening');
        btnMic.textContent = "Activar Micrófono";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        novaLog(`Usuario: ${transcript}`);
        processCommand(transcript);
    };

    btnMic.addEventListener('click', () => recognition.start());
    
    setTimeout(() => novaSpeak("Sistemas en línea. A la espera de sus directivas, Señor."), 1000);
});
