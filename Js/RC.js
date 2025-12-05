'use strict';

const API_URL = 'http://44.217.202.87:7000';


document.addEventListener('DOMContentLoaded', function () {
    // Inicializa la función correspondiente a la página actual
    if (document.getElementById('formStep1')) {
        initializeStep1();
    }
    if (document.getElementById('formStep2')) {
        initializeStep2();
    }
    if (document.getElementById('formStep3')) {
        initializeStep3();
    }
});

/**
 * PASO 1: (Página de "Olvidé mi contraseña")
 * Pide el email y llama al backend para enviar el código.
 */
function initializeStep1() {
    const formStep1 = document.getElementById('formStep1');

    formStep1.addEventListener('submit', async function(e) { // 👈 async
        e.preventDefault();
        const email = document.getElementById('email').value;

        if (!validateEmail(email)) {
            alert('📧 Por favor, ingresa un correo electrónico válido.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            // El backend siempre responde 200 (OK) por seguridad
            if (response.ok) {
                alert('Solicitud enviada. Si tu correo está registrado, recibirás un código.\n\n(Recuerda revisar la consola de Java si estás en modo simulación).');
                // Redirección al paso 2 (RC.html)
                window.location.href = 'RC.html';
            } else {
                 // Esto no debería pasar si el backend está bien configurado
                alert('Hubo un error inesperado al procesar tu solicitud.');
            }

        } catch (error) {
            console.error('Error de red:', error);
            alert('Error de conexión. No se pudo contactar al servidor.');
        }
    });
}

/**
 * PASO 2: (Página de "Ingresar Código")
 * Valida el código y lo guarda en localStorage para usarlo en el siguiente paso.
 */
function initializeStep2() {
    const formStep2 = document.getElementById('formStep2');

    formStep2.addEventListener('submit', function(e) {
        e.preventDefault();
        const code = document.getElementById('code').value;

        if (code.length < 6 || isNaN(code)) {
            alert('🔢 El código debe ser un número de al menos 6 dígitos.');
            return;
        }

        // 🎯 ¡IMPORTANTE! Guardamos el código para usarlo en el Paso 3
        localStorage.setItem('resetCode', code);

        console.log('Código guardado. Redirigiendo a la vista de nueva contraseña (RC2.html)...');
        
        // Redirección a la página de nueva contraseña
        window.location.href = 'RC2.html';
    });
}

/**
 * PASO 3: (Página de "Nueva Contraseña")
 * Pide la nueva contraseña, recupera el código de localStorage
 * y llama al backend para completar el reseteo.
 */
function initializeStep3() {
    const formStep3 = document.getElementById('formStep3');

    formStep3.addEventListener('submit', async function(e) { // 👈 async
        e.preventDefault();
        
        // Recuperamos el código del paso anterior
        const code = localStorage.getItem('resetCode');
        
        const newPass = document.getElementById('newPass').value;
        const confirmNewPass = document.getElementById('confirmNewPass').value;

        // --- Validaciones ---
        if (!code) {
            alert('❌ Error: No se encontró el código de reseteo. Por favor, vuelve a empezar.');
            window.location.href = '/vistas/regitro.html'; // O a la página del Paso 1
            return;
        }
        if (newPass.length < 6) {
            alert('🔒 La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (newPass !== confirmNewPass) {
            alert('❌ Las contraseñas no coinciden. Por favor, revísalas.');
            return;
        }
        
        // --- Llamada a la API ---
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code,
                    newPassword: newPass
                })
            });

            if (response.ok) {
                alert('✅ ¡Contraseña actualizada con éxito! Serás redirigido al inicio de sesión.');
                
                // Limpiamos el código de localStorage
                localStorage.removeItem('resetCode'); 
                
                // Redirección final al login
                window.location.href = '/vistas/regitro.html';
            } else {
                // El backend respondió 400 (Bad Request)
                alert('❌ Error: El código es inválido o ha expirado. Por favor, intenta de nuevo.');
                // Opcional: redirigir al Paso 1
                // window.location.href = 'RC.html'; 
            }

        } catch (error) {
            console.error('Error de red:', error);
            alert('Error de conexión. No se pudo contactar al servidor.');
        }
    });
}

/**
 * Función de utilidad para validar email.
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}