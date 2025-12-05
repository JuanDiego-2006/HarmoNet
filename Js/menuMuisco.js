'use strict';

const API_URL = 'http://44.217.202.87:7000';

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        nombre: document.getElementById('musico-nombre'),
        genero: document.getElementById('musico-genero'),
        ubicacion: document.getElementById('musico-ubicacion'),
        experiencia: document.getElementById('musico-experiencia'),
        correo: document.getElementById('musico-correo'),
        telefono: document.getElementById('musico-telefono'),
        descripcion: document.getElementById('musico-biografia'),
        foto: document.getElementById('musico-foto'),
        ratingContainer: document.getElementById('musico-rating'),

        btnCrear: document.getElementById('create-profile-btn'),
        postActions: document.getElementById('post-creation-actions'),
        btnEditar: document.getElementById('edit-profile-btn'),
        btnOcultar: document.getElementById('hide-profile-btn'),

        // Modal Elements
        modal: document.getElementById('edit-modal'),
        btnCloseModal: document.getElementById('close-edit-modal'),
        formEdit: document.getElementById('edit-profile-form'),
        inpEditNombre: document.getElementById('edit-nombre'),
        inpEditFoto: document.getElementById('edit-foto'),
        inpEditUbicacion: document.getElementById('edit-ubicacion'),
        inpEditDescripcion: document.getElementById('edit-descripcion'),
        inpEditGenero: document.getElementById('edit-genero'),
        inpEditExperiencia: document.getElementById('edit-experiencia'),

        userProfileBtn: document.querySelector('.main-nav .user-icon')
    };

    let currentProfileData = null;
    let currentUserId = null;
    let cachedCities = [];
    let cachedGenres = [];

    // --- Inicialización ---
    loadDashboard();

    // --- Event Listeners ---
    elements.btnEditar.addEventListener('click', openEditModal);
    elements.btnCloseModal.addEventListener('click', () => elements.modal.classList.remove('active'));
    elements.formEdit.addEventListener('submit', handleEditSubmit);

    // NUEVO: Conectar el botón de ocultar/mostrar
    elements.btnOcultar.addEventListener('click', () => {
        if (currentProfileData) {
            toggleProfileVisibility(currentProfileData.perfilVisible);
        }
    });

    if (elements.userProfileBtn) {
        elements.userProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openEditModal();
        });
    }

    // Previsualización de la foto en el modal
    if (elements.inpEditFoto) {
        elements.inpEditFoto.addEventListener('change', function (e) {
            const file = e.target.files[0];
            const preview = document.getElementById('edit-photo-preview');
            if (file && preview) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ----------------------------------------------------
    // FUNCIÓN DE NOTIFICACIONES (NUEVA)
    // ----------------------------------------------------
    function showNotification(message, type = 'success', duration = 3000) {
        const alertElement = document.getElementById('general-alert');
        if (!alertElement) return;

        // Limpiar clases y contenido
        alertElement.className = '';
        alertElement.textContent = message;

        // Aplicar clases de estado
        alertElement.classList.add(type === 'success' ? 'alert-success' : 'alert-error');

        // Mostrar la alerta
        setTimeout(() => {
            alertElement.classList.add('alert-show');
        }, 50); // Pequeño delay para la animación de entrada

        // Ocultar después de la duración
        setTimeout(() => {
            alertElement.classList.remove('alert-show');
        }, duration);
    }


    // ----------------------------------------------------
    // FUNCIÓN DE CATÁLOGOS
    // ----------------------------------------------------

    function populateSelect(selectElement, data, idKey, nameKey, nameSuffix = '') {
        selectElement.innerHTML = `<option value="">Selecciona una opción</option>`;

        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[idKey];
            option.textContent = item[nameKey] + nameSuffix;
            selectElement.appendChild(option);
        });
    }

    async function fetchAndCacheCatalogs() {
        try {
            // 1. Cargar Ciudades
            const cityResponse = await fetch(`${API_URL}/catalog/cities`);
            if (cityResponse.ok) {
                cachedCities = await cityResponse.json();
                populateSelect(elements.inpEditUbicacion, cachedCities, 'ciudadId', 'nombre', ' (' + 'estadoOProvincia' + ')');
            }

            // 2. Cargar Géneros
            const genreResponse = await fetch(`${API_URL}/catalog/genres`);
            if (genreResponse.ok) {
                cachedGenres = await genreResponse.json();
                populateSelect(elements.inpEditGenero, cachedGenres, 'nombre', 'nombre');
            }

        } catch (error) {
            console.error('Error al cargar catálogos:', error);
            showNotification('Error cargando opciones de edición.', 'error');
        }
    }


    // ----------------------------------------------------
    // FUNCIÓN CENTRAL PARA CARGAR DATOS
    // ----------------------------------------------------
    async function loadDashboard() {
        const userData = JSON.parse(localStorage.getItem('hermonetUser'));
        if (!userData || userData.tipoUsuarioId !== 2) {
            window.location.href = '../index.html';
            return;
        }
        currentUserId = userData.usuarioId;

        await fetchAndCacheCatalogs(); // Cargar Catálogos antes que el perfil

        try {
            const userResponse = await fetch(`${API_URL}/users/${currentUserId}`);
            const user = await userResponse.json();

            elements.correo.textContent = user.email;
            elements.telefono.textContent = user.telefono;

            const profileResponse = await fetch(`${API_URL}/musicians/${currentUserId}`);

            if (profileResponse.ok) {
                const profile = await profileResponse.json();
                currentProfileData = profile;
                renderProfile(profile, user);

                elements.btnCrear.style.display = 'none';
                elements.postActions.style.display = 'flex';
            } else {
                elements.btnCrear.style.display = 'block';
                elements.postActions.style.display = 'none';
                elements.descripcion.textContent = "No tienes perfil creado.";
            }
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            showNotification('Error de red al cargar el perfil.', 'error');
        }
    }


    function renderProfile(profile, user) {
        elements.nombre.textContent = profile.nombreArtistico || user.nombreCompleto;

        const descData = parseDescripcion(profile.descripcion);
        elements.genero.textContent = descData.genero;
        elements.experiencia.textContent = descData.experiencia;
        elements.descripcion.textContent = descData.biografia;

        // Mostrar Ubicación (usando el caché para traducir el ID a nombre)
        const city = cachedCities.find(c => c.ciudadId === profile.ubicacionPrincipalId);
        elements.ubicacion.textContent = city ? `${city.nombre} (${city.estadoOProvincia})` : 'Desconocida';

        // Renderizar Foto
        if (profile.fotoPerfilUrl && profile.fotoPerfilUrl.trim() !== "") {
            elements.foto.src = profile.fotoPerfilUrl;
        } else {
            elements.foto.src = "/Imagenes/f2.jpg";
        }

        // --- LÓGICA DE VISIBILIDAD DEL BOTÓN (CORREGIDA) ---
        const isVisible = profile.perfilVisible;
        elements.btnOcultar.textContent = isVisible ? 'Ocultar Perfil' : 'Mostrar Perfil';
        elements.btnOcultar.classList.toggle('hide-button', isVisible);
        elements.btnOcultar.classList.toggle('show-button', !isVisible);

        const rating = profile.calificacionPromedio || 0;
        const count = profile.totalResenas || 0;
        renderStars(rating, count);
    }

    function renderStars(rating, count) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= rating) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        starsHtml += `<span class="rating-text">(${count} reseñas)</span>`;
        elements.ratingContainer.innerHTML = starsHtml;
    }

    function openEditModal() {
        if (!currentProfileData) return;

        elements.inpEditNombre.value = currentProfileData.nombreArtistico;

        const descData = parseDescripcion(currentProfileData.descripcion);

        // 1. Ubicación (ID)
        elements.inpEditUbicacion.value = currentProfileData.ubicacionPrincipalId;
        // 2. Género (String)
        elements.inpEditGenero.value = descData.genero;
        // 3. Experiencia (String)
        elements.inpEditExperiencia.value = descData.experiencia;
        // 4. Biografía (String)
        elements.inpEditDescripcion.value = descData.biografia;

        const preview = document.getElementById('edit-photo-preview');
        if (preview) preview.src = currentProfileData.fotoPerfilUrl || "/Imagenes/f2.jpg";

        elements.modal.classList.add('active');
    }

    // ----------------------------------------------------
    // FUNCIÓN PARA OCULTAR / MOSTRAR PERFIL (ACTUALIZADA)
    // ----------------------------------------------------
    async function toggleProfileVisibility(currentVisibility) {
        const newVisibility = !currentVisibility;
        const action = newVisibility ? 'mostrar' : 'ocultar';

        if (!confirm(`¿Estás seguro de que quieres ${action} tu perfil? Esto afectará tu visibilidad para los clientes.`)) {
            return;
        }

        const btn = elements.btnOcultar;
        btn.disabled = true;
        btn.textContent = `${action.toUpperCase()}...`;

        try {
            // Objeto de actualización: copia el perfil actual y solo cambia la visibilidad
            const updateData = {
                ...currentProfileData,
                perfilVisible: newVisibility
            };

            // Necesitamos enviar todos los campos para el PUT, incluyendo los que no se editan
            // Reconstruimos el formato de descripción limpio para asegurar consistencia
            const descData = parseDescripcion(currentProfileData.descripcion);
            updateData.descripcion = `${descData.genero}|${descData.experiencia}|${descData.biografia}`;

            const updateRes = await fetch(`${API_URL}/musicians/${currentUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!updateRes.ok) {
                const errorText = await updateRes.text();
                throw new Error(errorText || 'Fallo en la actualización de visibilidad.');
            }

            // ÉXITO: Recargar el dashboard 
            await loadDashboard();
            showNotification(`Perfil ${newVisibility ? 'VISIBLE' : 'OCULTO'} con éxito.`, 'success');

        } catch (error) {
            console.error('Error al cambiar visibilidad:', error);
            showNotification("Error al cambiar visibilidad: " + error.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    // ... (rest of update and parsing functions are the same) ...

    async function uploadNewProfilePhoto(musicoId, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/musicians/${musicoId}/photo`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fallo al subir foto (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        return result.fotoPerfilUrl;
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        const submitBtn = elements.formEdit.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Guardando...";

        try {
            let newImageUrl = currentProfileData.fotoPerfilUrl;

            // 1. Subir foto si aplica
            if (elements.inpEditFoto.files.length > 0) {
                const file = elements.inpEditFoto.files[0];
                submitBtn.textContent = "Subiendo foto...";
                newImageUrl = await uploadNewProfilePhoto(currentUserId, file);
            }

            // 2. Actualizamos el resto de los datos del perfil (texto)
            // FORMATO LIMPIO: GENERO|EXPERIENCIA|BIOGRAFIA
            const fullDesc = `${elements.inpEditGenero.value}|${elements.inpEditExperiencia.value}|${elements.inpEditDescripcion.value}`;

            const updateData = {
                musicoId: currentUserId,
                nombreArtistico: elements.inpEditNombre.value,
                ubicacionPrincipalId: parseInt(elements.inpEditUbicacion.value),
                descripcion: fullDesc,
                fotoPerfilUrl: newImageUrl,
                perfilVisible: currentProfileData.perfilVisible
            };

            submitBtn.textContent = "Actualizando perfil...";
            const updateRes = await fetch(`${API_URL}/musicians/${currentUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!updateRes.ok) {
                const errorText = await updateRes.text();
                throw new Error(`Fallo al actualizar perfil (${updateRes.status}): ${errorText}`);
            }

            // 3. ÉXITO: Refrescar la pantalla
            elements.modal.classList.remove('active');
            await loadDashboard();
            showNotification("Perfil actualizado con éxito.", 'success');

        } catch (error) {
            console.error(error);
            showNotification("Error: " + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Guardar Cambios";
        }
    }

    // Utilidad de parseo (Mantenida)
    function parseDescripcion(fullDesc) {
        if (!fullDesc) return { genero: 'N/A', experiencia: 'N/A', biografia: '' };

        const parts = fullDesc.split('|');
        if (parts.length >= 3) {
            return {
                genero: parts[0].trim(),
                experiencia: parts[1].trim(),
                biografia: parts.slice(2).join('|').trim()
            };
        }

        const fullText = fullDesc;

        const generoMatch = fullText.match(/\*\*Género Principal:\*\* ([^\n]*)/i);
        const genero = generoMatch && generoMatch[1] ? generoMatch[1].trim() : 'Varios';

        const experienciaMatch = fullText.match(/\*\*Experiencia:\*\* ([^\n]*)/i);
        const experiencia = experienciaMatch && experienciaMatch[1] ? experienciaMatch[1].trim() : 'N/A';

        let biografia = fullText;
        biografia = biografia.replace(/\*\*Género Principal:\*\* [^\n]*/i, '').trim();
        biografia = biografia.replace(/\*\*Experiencia:\*\* [^\n]*/i, '').trim();
        biografia = biografia.replace(/\n{2,}/g, '\n').trim();

        if (genero !== 'Varios' || experiencia !== 'N/A') {
            return { genero: genero, experiencia: experiencia, biografia: biografia };
        }

        return { genero: 'Varios', experiencia: 'N/A', biografia: fullDesc };
    }
    
    loadStats(currentUserId);

    async function loadStats(musicoId) {
        try {
            const response = await fetch(`${API_URL}/musicians/${musicoId}/stats`);
            if (response.ok) {
                const stats = await response.json();
                
                const statSol = document.getElementById('stat-solicitudes');
                const statCon = document.getElementById('stat-contratos');
                
                const valSolicitudes = stats.solicitudesTotal || 0;
                const valContratos = stats.contratacionesTotal || 0;

                if(statSol) animateValue(statSol, 0, valSolicitudes, 1000);
                if(statCon) animateValue(statCon, 0, valContratos, 1000);
                
            }
        } catch (error) {
            console.error("Error cargando estadísticas", error);
        }
    }

    // Efecto visual de conteo
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
});