'use strict';

const API_URL = 'http://44.217.202.87:7000';

const AppState = {
    currentTab: 'login',
    userType: 'cliente',
    passwordVisibility: {
        'login-password': false,
        'register-password': false
    }
};

document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    initializeTabs();
    initializePasswordToggles();
    initializeUserTypeSwitch();
    initializeForms();

    console.log('✅ HermoNet: Aplicación inicializada correctamente');
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');

    if (!tabButtons.length) {
        console.warn('⚠️ No se encontraron botones de pestañas');
        return;
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            handleTabChange(this);
        });
    });
}

function handleTabChange(clickedButton) {
    const targetTab = clickedButton.getAttribute('data-tab');

    if (!targetTab) {
        console.error('❌ El botón no tiene atributo data-tab');
        return;
    }

    AppState.currentTab = targetTab;

    const allTabButtons = document.querySelectorAll('.tab-button');
    allTabButtons.forEach(button => {
        const isActive = button.getAttribute('data-tab') === targetTab;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive);
    });

    const allPanels = document.querySelectorAll('.tab-panel');
    allPanels.forEach(panel => {
        const isActive = panel.id === `${targetTab}-panel`;
        panel.classList.toggle('active', isActive);
    });

    console.log(`📑 Pestaña cambiada a: ${targetTab}`);
}

function initializePasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle');

    if (!toggleButtons.length) {
        console.warn('⚠️ No se encontraron botones de toggle de contraseña');
        return;
    }

    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            handlePasswordToggle(this);
        });
    });
}

function handlePasswordToggle(button) {
    const targetId = button.getAttribute('data-target');

    if (!targetId) {
        console.error('❌ El botón toggle no tiene atributo data-target');
        return;
    }

    const passwordInput = document.getElementById(targetId);

    if (!passwordInput) {
        console.error(`❌ No se encontró el input con id: ${targetId}`);
        return;
    }

    const isCurrentlyPassword = passwordInput.type === 'password';
    passwordInput.type = isCurrentlyPassword ? 'text' : 'password';

    AppState.passwordVisibility[targetId] = !isCurrentlyPassword;

    button.classList.toggle('active', !isCurrentlyPassword);

    const newLabel = isCurrentlyPassword ? 'Ocultar contraseña' : 'Mostrar contraseña';
    button.setAttribute('aria-label', newLabel);

    console.log(`👁️ Visibilidad de contraseña (${targetId}): ${!isCurrentlyPassword ? 'visible' : 'oculta'}`);
}

function initializeUserTypeSwitch() {
    const switchButton = document.querySelector('.switch-button');

    if (!switchButton) {
        console.warn('⚠️ No se encontró el switch de tipo de usuario');
        return;
    }

    switchButton.addEventListener('click', function () {
        handleUserTypeSwitch(this);
    });
}

function handleUserTypeSwitch(switchButton) {
    const isChecked = switchButton.getAttribute('aria-checked') === 'true';
    const newUserType = isChecked ? 'cliente' : 'musico';

    AppState.userType = newUserType;

    switchButton.setAttribute('aria-checked', !isChecked);

    const labels = document.querySelectorAll('.toggle-label');
    labels.forEach(label => {
        const labelType = label.getAttribute('data-type');
        label.classList.toggle('active', labelType === newUserType);
    });

    updateRegisterButtonText(newUserType);

    console.log(`👤 Tipo de usuario cambiado a: ${newUserType}`);
}

function updateRegisterButtonText(userType) {
    const registerButton = document.getElementById('register-submit');

    if (!registerButton) {
        console.warn('⚠️ No se encontró el botón de registro');
        return;
    }

    const buttonText = userType === 'musico'
        ? 'Registrarme como Músico'
        : 'Registrarme como Cliente';

    registerButton.textContent = buttonText;
}

function initializeForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    } else {
        console.warn('⚠️ No se encontró el formulario de login');
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    } else {
        console.warn('⚠️ No se encontró el formulario de registro');
    }

    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
}// Función auxiliar para leer el error de forma segura (sea texto o JSON)
async function getErrorMessage(response) {
    try {
        const text = await response.text();
        try {
            // Intentamos parsear como JSON por si el backend envió un objeto
            const json = JSON.parse(text);
            return json.message || json.error || text;
        } catch (e) {
            // Si falla el parseo, es texto plano (ej: "Credenciales inválidas")
            return text;
        }
    } catch (error) {
        return `Error ${response.status}: ${response.statusText}`;
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const formData = {
        email: event.target.email.value,
        passwordHash: event.target.password.value 
    };

    if (!validateEmail(formData.email)) {
        showNotification('Por favor, ingresa un email válido', 'error');
        return;
    }

    if (formData.passwordHash.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    console.log('🔐 Intento de inicio de sesión:', formData);
    showNotification(`Iniciando sesión...`, 'info');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const datosDelUsuario = await response.json();
            localStorage.setItem('hermonetUser', JSON.stringify(datosDelUsuario));
            console.log('✅ Login exitoso:', datosDelUsuario);
            showNotification('¡Bienvenido! Redirigiendo...', 'success');

            setTimeout(() => {
                if (datosDelUsuario.tipoUsuarioId === 2) {
                    window.location.replace('/vistas/menuMusico.html');
                } else {
                    window.location.replace('../index.html');
                }
            }, 1000);

        } else {
            // CORRECCIÓN PRINCIPAL: Usamos la función auxiliar
            const errorMsg = await getErrorMessage(response);
            console.warn('Login fallido:', errorMsg);
            
            // Mensajes específicos basados en el status
            if (response.status === 401) {
                showNotification('Correo o contraseña incorrectos.', 'error');
            } else {
                showNotification(errorMsg || 'Error al iniciar sesión.', 'error');
            }
        }

    } catch (error) {
        console.error('Error de red/lógica:', error);
        showNotification('No se pudo conectar con el servidor. Revisa tu internet.', 'error');
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();

    const rawData = {
        name: event.target.name.value,
        email: event.target.email.value,
        phoneNumber: event.target.phoneNumber.value,
        password: event.target.password.value,
        userType: AppState.userType
    };

    // --- VALIDACIONES ---
    if (rawData.name.trim().length < 3) { 
        showNotification('El nombre debe tener al menos 3 caracteres.', 'error');
        return;
    }
    if (!validateEmail(rawData.email)) { 
        showNotification('Por favor, ingresa un correo electrónico válido.', 'error');
        return;
    }
    if (!validatePhoneNumber(rawData.phoneNumber)) { 
        showNotification('El número de celular debe tener 10 dígitos.', 'error');
        return;
    }
    if (rawData.password.length < 12) { 
        showNotification('La contraseña debe tener al menos 12 caracteres.', 'error');
        return;
    }

    const tipoUsuarioId = (rawData.userType === 'musico') ? 2 : 1;

    const apiPayload = {
        nombreCompleto: rawData.name,
        email: rawData.email,
        telefono: rawData.phoneNumber,
        passwordHash: rawData.password,
        tipoUsuarioId: tipoUsuarioId
    };

    console.log('📝 Intento de registro:', apiPayload);
    const userTypeLabel = rawData.userType === 'musico' ? 'Músico' : 'Cliente';
    showNotification(`Registrando...`, 'info');

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiPayload)
        });

        if (response.ok) {
            console.log('✅ Registro exitoso');
            showNotification('¡Registro exitoso! Por favor, inicia sesión.', 'success');

            // Limpiar formulario y cambiar a tab de login
            event.target.reset();
            const loginButton = document.querySelector('[data-tab="login"]');
            if (loginButton) handleTabChange(loginButton);

        } else {
            // CORRECCIÓN: Obtener mensaje exacto del backend
            const errorMsg = await getErrorMessage(response);
            console.error('Error de registro:', errorMsg);

            if (response.status === 409) {
                showNotification('Este correo ya está registrado. Intenta iniciar sesión.', 'error');
            } else {
                showNotification(errorMsg || 'No se pudo completar el registro.', 'error');
            }
        }

    } catch (error) {
        console.error('Error de red:', error);
        showNotification('No se pudo conectar con el servidor. Verifica que el Backend esté corriendo.', 'error');
    }
}

function handleForgotPassword(event) {
    event.preventDefault();
    console.log('🔑 Redirigiendo a la vista de Recuperación de contraseña...');
    window.location.href = 'RecuperarContraseña.html';
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phoneNumber.trim());
}

// Esta función ya no es necesaria si no la usas en otro lado
// function simulateAsyncOperation(callback) {
//     setTimeout(callback, 1000);
// }

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: '500',
        maxWidth: '320px',
        zIndex: '1000',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        animation: 'slideIn 0.3s ease',
        backgroundColor: type === 'success' ? '#10b981' :
            type === 'error' ? '#ef4444' :
                '#3b82f6'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

window.addEventListener('error', function (event) {
    console.error('❌ Error global capturado:', event.error);
});

window.addEventListener('unhandledrejection', function (event) {
    console.error('❌ Promesa rechazada no manejada:', event.reason);
});

window.HermoNetDebug = {
    getState: () => AppState,
    switchTab: (tab) => {
        const button = document.querySelector(`[data-tab="${tab}"]`);
        if (button) handleTabChange(button);
    },
    switchUserType: () => {
        const switchButton = document.querySelector('.switch-button');
        if (switchButton) handleUserTypeSwitch(switchButton);
    }
};

console.log('💡 Debug disponible en: window.HermoNetDebug');