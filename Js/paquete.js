const API_URL = 'http://44.217.202.87:7000';

document.addEventListener('DOMContentLoaded', () => {

    const eventList = document.querySelector('.event-list');
    const confirmationModal = document.getElementById('confirmationModal');
    const editModal = document.getElementById('editModal');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const editCancelBtn = document.getElementById('editCancelBtn');
    const editForm = document.getElementById('editForm');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');

    // Referencias de campos de edición
    const editPackageTitleInput = document.getElementById('editPackageTitle');
    const editPackageDescriptionInput = document.getElementById('editPackageDescription');
    const editPackagePriceInput = document.getElementById('editPackagePrice');
    const editPackageDurationInput = document.getElementById('editPackageDuration');
    const editPackageMusiciansInput = document.getElementById('editPackageMusicians');

    // Almacena la tarjeta y la acción actual
    let currentCard = null;
    let currentAction = null;
    let currentPaqueteId = null;
    // Almacenará los datos de los paquetes para la edición
    let paquetesData = {}; 

    // --- 1. FUNCIÓN PRINCIPAL DE CARGA ---
    async function cargarPaquetes() {
        const musicoId = getMusicoId();
        if (!musicoId) {
            mostrarError('No se pudo cargar paquetes: Usuario no autenticado.');
            return;
        }

        const apiUrl = `${API_URL}/musicians/${musicoId}/packages`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudieron cargar los paquetes.`);
            }
            const paquetes = await response.json();

            // Limpiamos la lista (quitando el template)
            eventList.innerHTML = ''; 

            if (paquetes.length === 0) {
                mostrarError('Aún no tienes paquetes creados. <a href="CrearPaquete.html" style="color: white; text-decoration: underline;">¡Crea el primero!</a>');
                return;
            }

            // Almacenamos los datos y dibujamos las tarjetas
            paquetes.forEach(paquete => {
                paquetesData[paquete.paqueteId] = paquete; // Guardamos los datos
                const cardHTML = crearCardHTML(paquete);
                eventList.insertAdjacentHTML('beforeend', cardHTML);
            });

        } catch (error) {
            console.error('Error al cargar paquetes:', error);
            mostrarError(error.message);
        }
    }

    // --- 2. HELPERS DE CARGA ---

    function getMusicoId() {
        const userData = JSON.parse(localStorage.getItem('hermonetUser'));
        if (!userData || !userData.usuarioId) {
            console.error('No se encontró usuarioId en localStorage');
            return null;
        }
        return userData.usuarioId;
    }

    function mostrarError(mensaje) {
        eventList.innerHTML = `<p style="text-align: center; color: #fff; padding: 2rem;">${mensaje}</p>`;
    }

    // Dibuja el HTML de una tarjeta de paquete [cite: example/models/Paquete.java]
    function crearCardHTML(paquete) { 
        const isHidden = !paquete.activo;
        const hiddenClass = isHidden ? 'hidden-package' : '';
        const statusText = isHidden ? 'Oculto' : 'Disponible';
        const statusClass = isHidden ? 'hidden' : 'available'; // (CSS para .status.hidden)
        const eyeIcon = isHidden ? 'fa-eye-slash' : 'fa-eye';

        // Extraer la cantidad de músicos de la descripción
        let musicianCount = 1; 
        const regex = /\(Cantidad de músicos: (\d+)\)/;
        const match = paquete.descripcion.match(regex);
        if (match && match[1]) {
            musicianCount = match[1];
        }

        // Muestra solo la primera línea de la descripción
        const descripcionCorta = paquete.descripcion.split('\n')[0];

        return `
        <div class="event-card ${hiddenClass}" data-paquete-id="${paquete.paqueteId}">
            <div class="status ${statusClass}">${statusText}</div>
            <div class="card-content">
                <div class="text-details">
                    <h2>${paquete.nombrePaquete}</h2>
                    <p title="${paquete.descripcion}">${descripcionCorta}</p>
                    <div class="tags">
                        <span class="tag">${paquete.duracionHoras} Horas</span>
                    </div>
                    <span class="musicians-count" style="display:none;">${musicianCount}</span>
                </div>
                <div class="price-details">
                    <span class="price gradient-text">$${paquete.precioBase.toFixed(2)}</span>
                    <span class="per-hour">Total del paquete</span>
                    <div class="actions">
                        <!-- ICONO DE BASURA ELIMINADO -->
                        <i class="fas fa-pencil-alt" data-action="edit" title="Editar"></i>
                        <i class="fas ${eyeIcon}" data-action="toggle-visibility" title="${isHidden ? 'Mostrar' : 'Ocultar'}"></i> 
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // --- 3. MANEJO DE ACCIONES (EVENT DELEGATION) ---

    eventList.addEventListener('click', (event) => {
        const actionIcon = event.target.closest('.actions i');
        if (!actionIcon) return;

        currentCard = event.target.closest('.event-card');
        currentPaqueteId = currentCard.dataset.paqueteId;
        const paquete = paquetesData[currentPaqueteId];
        currentAction = actionIcon.dataset.action;
        
        // --- 1. Lógica para EDITAR ✏️ --- (Ahora es la primera)
        if (currentAction === 'edit') {
            // Precargar el modal con los datos del paquete
            editPackageTitleInput.value = paquete.nombrePaquete;
            editPackageDescriptionInput.value = paquete.descripcion;
            editPackagePriceInput.value = paquete.precioBase;
            editPackageDurationInput.value = paquete.duracionHoras;
            
            // Extraer músicos de la descripción (si existe)
            const regex = /\(Cantidad de músicos: (\d+)\)/;
            const match = paquete.descripcion.match(regex);
            editPackageMusiciansInput.value = (match && match[1]) ? match[1] : 1;
            
            editModal.style.display = 'block';
        }
        
        // --- 2. Lógica para OCULTAR/MOSTRAR 👁️ ---
        else if (currentAction === 'toggle-visibility') {
            const isHidden = !paquete.activo; // El estado actual
            const actionVerb = isHidden ? 'mostrar' : 'ocultar';

            currentAction = isHidden ? 'SHOW' : 'HIDE';
            modalTitle.textContent = `${isHidden ? 'Mostrar' : 'Ocultar'} Paquete`;
            modalMessage.innerHTML = `¿Desea ${actionVerb} el paquete: <strong>"${paquete.nombrePaquete}"</strong>?`;
            confirmationModal.style.display = 'block';
        }
        // --- LÓGICA DE 'DELETE' ELIMINADA ---
    });

    // --- 4. EJECUCIÓN DE ACCIONES (MODALES) ---

    // Botón "Sí" del modal de confirmación (SOLO Ocultar/Mostrar)
    confirmBtn.onclick = async () => {
        const paqueteId = currentPaqueteId;
        const paquete = paquetesData[paqueteId];
        
        // --- LÓGICA DE 'DELETE' ELIMINADA ---

        if (currentAction === 'HIDE' || currentAction === 'SHOW') {
            // --- API: Ocultar/Mostrar Paquete (es un Update) ---
            const nuevoEstado = (currentAction === 'SHOW'); // Si la acción es "SHOW", el nuevo estado es "activo = true"
            
            // Copiamos los datos y solo cambiamos 'activo'
            const paqueteActualizado = { ...paquete, activo: nuevoEstado };
            
            try {
                const response = await fetch(`${API_URL}/packages/${paqueteId}`, { // [cite: example/routes/PaqueteRoutes.java]
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(paqueteActualizado)
                });
                if (!response.ok) {
                    throw new Error('No se pudo actualizar el estado.');
                }
                
                // Actualizar la UI
                paquetesData[paqueteId].activo = nuevoEstado;
                const newCardHTML = crearCardHTML(paquetesData[paqueteId]);
                currentCard.outerHTML = newCardHTML; // Reemplaza la tarjeta vieja
                alert(`Paquete "${paquete.nombrePaquete}" ahora está ${nuevoEstado ? 'visible' : 'oculto'}.`);

            } catch(err) {
                alert(`Error: ${err.message}`);
            }
        }
        
        closeModal(confirmationModal);
        currentCard = null;
        currentAction = null;
        currentPaqueteId = null;
    };
    
    // Formulario de "Guardar Cambios" (Editar)
    editForm.onsubmit = async (e) => {
        e.preventDefault(); 
        
        const paqueteId = currentPaqueteId;
        const paqueteOriginal = paquetesData[paqueteId];

        // --- API: Editar Paquete ---
        
        // Creamos el nuevo objeto de paquete con los datos del formulario
        const paqueteActualizado = {
            ...paqueteOriginal, // Mantiene IDs y campos no editables
            nombrePaquete: editPackageTitleInput.value.trim(),
            descripcion: editPackageDescriptionInput.value.trim(),
            precioBase: parseFloat(editPackagePriceInput.value),
            duracionHoras: parseFloat(editPackageDurationInput.value),
        };
        
        // Opcional: Re-insertar la cantidad de músicos en la descripción
        const newMusicians = editPackageMusiciansInput.value;
        const regex = /\n\n\(Cantidad de músicos: \d+\)/;
        paqueteActualizado.descripcion = paqueteActualizado.descripcion.replace(regex, ''); // Limpia la vieja
        paqueteActualizado.descripcion += `\n\n(Cantidad de músicos: ${newMusicians})`; // Añade la nueva

        try {
            const response = await fetch(`${API_URL}/packages/${paqueteId}`, { // [cite: example/routes/PaqueteRoutes.java]
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paqueteActualizado)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'No se pudo guardar los cambios.');
            }
            
            const paqueteGuardado = await response.json(); // La API devuelve el paquete actualizado [cite: example/controller/PaqueteController.java]

            // Actualizar la UI
            paquetesData[paqueteId] = paqueteGuardado; // Actualiza el 'caché'
            const newCardHTML = crearCardHTML(paqueteGuardado);
            currentCard.outerHTML = newCardHTML;
            
            alert(`¡Cambios guardados! Paquete "${paqueteGuardado.nombrePaquete}" actualizado.`);
            closeModal(editModal);

        } catch (err) {
            alert(`Error al guardar: ${err.message}`);
        }

        currentCard = null;
        currentAction = null;
        currentPaqueteId = null;
    };

    // --- 5. LÓGICA DE MODALES (Sin cambios) ---
    
    function closeModal(modalElement) {
        modalElement.style.display = 'none';
    }
    
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.onclick = (e) => closeModal(e.target.closest('.modal'));
    });
    
    cancelBtn.onclick = () => closeModal(confirmationModal);
    editCancelBtn.onclick = () => closeModal(editModal);
    
    window.onclick = (event) => {
        if (event.target === confirmationModal) {
            closeModal(confirmationModal);
        }
        if (event.target === editModal) {
            closeModal(editModal);
        }
    };

    // --- INICIAR LA CARGA DE PAQUETES ---
    cargarPaquetes();
});