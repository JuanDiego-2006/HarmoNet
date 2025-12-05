'use strict';

const API_URL = 'http://44.217.202.87:7000';


document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('create-profile-form');
    const errorMessage = document.getElementById('error-message');
    const successModal = document.getElementById('success-modal');
    const submitButton = document.querySelector('.submit-button.create-button');

    // Referencias
    const profilePicInput = document.getElementById('profile-picture');
    const previewImage = document.getElementById('preview-image');
    const avatarPreview = document.getElementById('avatar-preview');

    const locationSelect = document.getElementById('location');
    const genreSelect = document.getElementById('genre'); // <-- Nueva referencia al select de género

    const menuMusicoPath = '/vistas/menuMusico.html';

    // --- FUNCIÓN PARA CARGAR CATÁLOGOS (CIUDADES Y GÉNEROS) ---
    async function fetchAndPopulateCatalogs() {
        try {
            // 1. Cargar Ciudades
            const cityResponse = await fetch(`${API_URL}/catalog/cities`);
            if (!cityResponse.ok) throw new Error("Error al cargar ciudades");
            const cities = await cityResponse.json();
            
            locationSelect.innerHTML = '<option value="">Selecciona tu ubicación</option>';
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.ciudadId; // ID para ubicación
                option.textContent = `${city.nombre} (${city.estadoOProvincia})`;
                locationSelect.appendChild(option);
            });

            // 2. Cargar Géneros
            const genreResponse = await fetch(`${API_URL}/catalog/genres`);
            if (!genreResponse.ok) throw new Error("Error al cargar géneros");
            const genres = await genreResponse.json();

            genreSelect.innerHTML = '<option value="">Selecciona un género</option>';
            genres.forEach(genre => {
                const option = document.createElement('option');
                // IMPORTANTE: Usamos el NOMBRE como valor, porque se guarda como texto en la descripción
                option.value = genre.nombre; 
                option.textContent = genre.nombre;
                genreSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error cargando catálogos:', error);
            showError('No se pudieron cargar las opciones disponibles. Revisa tu conexión.');
        }
    }

    // Llamar a la función al cargar la página
    fetchAndPopulateCatalogs();


    // 1. Lógica de Previsualización de Imagen
    if (avatarPreview && profilePicInput) {
        avatarPreview.addEventListener('click', () => profilePicInput.click());
        profilePicInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImage.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // 2. Envío del Formulario
    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        hideError();

        submitButton.disabled = true;
        submitButton.textContent = 'Procesando...';
        
        const fields = {
            artistName: document.getElementById('artist-name').value,
            genre: document.getElementById('genre').value,     // Ahora viene de la DB (el nombre)
            location: document.getElementById('location').value, // Ahora viene de la DB (el ID)
            experience: document.getElementById('experience').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            biography: document.getElementById('biography').value,
        };
        
        const emptyFields = validateFields(fields);
        if (emptyFields.length > 0) {
            showError(`¡Faltan campos por llenar!: ${emptyFields.join(', ')}.`);
            resetButton();
            return;
        }

        const userData = JSON.parse(localStorage.getItem('hermonetUser'));
        if (!userData || !userData.usuarioId) {
            showError('Error: Sesión no válida. Inicia sesión de nuevo.');
            resetButton();
            return;
        }

        const ubicacionId = parseInt(fields.location);
        if (isNaN(ubicacionId) || ubicacionId <= 0) {
            showError('Selecciona una ubicación válida.');
            resetButton();
            return;
        }
        
        // FORMATO LIMPIO PARA GUARDAR: GENERO|EXPERIENCIA|BIOGRAFIA
        const descripcionCompleta = `${fields.genre}|${fields.experience}|${fields.biography}`.trim();

        // PASO 1: Datos de Perfil
        const perfilData = {
            musicoId: userData.usuarioId,
            nombreArtistico: fields.artistName,
            descripcion: descripcionCompleta,
            ubicacionPrincipalId: ubicacionId,
            fotoPerfilUrl: null,
            perfilVisible: true
        };

        try {
            // 1. CREAR PERFIL (JSON)
            let response = await fetch(`${API_URL}/musicians`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(perfilData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Fallo en el servidor al crear perfil.");
            }

            // 2. SUBIR FOTO (Multipart Form)
            const file = profilePicInput.files[0];
            if (file) {
                submitButton.textContent = 'Subiendo foto...';
                await uploadProfilePhoto(userData.usuarioId, file);
            }

            // 3. ÉXITO
            handleSuccessAndRedirect();

        } catch (error) {
            console.error('Error:', error);
            showError('Error al crear perfil: ' + error.message);
            resetButton();
        }
    });

    async function uploadProfilePhoto(musicoId, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/musicians/${musicoId}/photo`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error("Fallo al subir foto: " + errorText);
        }
    }


    function handleSuccessAndRedirect() {
        const formCard = document.querySelector('.profile-card');
        if (formCard) formCard.style.display = 'none';

        successModal.classList.remove('hidden');

        setTimeout(() => {
            window.location.replace(menuMusicoPath);
        }, 2500);
    }

    function validateFields(fields) {
        const empty = [];
        if (!fields.artistName.trim()) empty.push('Nombre Artista');
        if (!fields.genre.trim()) empty.push('Género');
        if (!fields.location.trim()) empty.push('Ubicación');
        if (!fields.experience.trim()) empty.push('Experiencia');
        if (!fields.email.trim()) empty.push('Correo');
        if (!fields.phone.trim()) empty.push('Teléfono');
        if (!fields.biography.trim()) empty.push('Biografía/Descripción');
        return empty;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
    }

    function hideError() {
        errorMessage.classList.remove('visible');
    }

    function resetButton() {
        submitButton.disabled = false;
        submitButton.textContent = 'Crear Perfil';
    }
});