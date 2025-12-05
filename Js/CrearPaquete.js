const API_URL = 'http://44.217.202.87:7000';

document.addEventListener('DOMContentLoaded', async () => { 

    const form = document.getElementById('formCrearPaquete');
    // Eliminamos la referencia a locationSelect
    const modalExito = document.getElementById('modalExito');
    const modalError = document.getElementById('modalError');
    const cerrarModales = document.querySelectorAll('.btn-cerrar-modal');
    const btnVolverPerfil = document.querySelector('.btn-volver-perfil');
    const submitButton = document.querySelector('.btn-guardar');
    const errorText = document.querySelector('#modalError p') || document.createElement('p');

    // ---------------------------------------------------------
    // NOTA: Se eliminó la función cargarCiudades() ya que
    // no se usará ubicación en este formulario.
    // ---------------------------------------------------------

    // ---------------------------------------------------------
    // FUNCIONES DE UTILIDAD (MODALES Y USUARIO)
    // ---------------------------------------------------------

    function mostrarModal(modalElement) {
        modalElement.classList.add('active');
    }

    function ocultarModales() {
        modalExito.classList.remove('active');
        modalError.classList.remove('active');
    }

    cerrarModales.forEach(btn => {
        btn.addEventListener('click', ocultarModales);
    });

    window.addEventListener('click', (event) => {
        if (event.target === modalError || event.target === modalExito) {
            ocultarModales();
        }
    });

    function getMusicoId() {
        const userData = JSON.parse(localStorage.getItem('hermonetUser'));
        if (!userData || !userData.usuarioId) {
            console.error('No se encontró usuarioId en localStorage');
            return null;
        }
        return userData.usuarioId;
    }

    // ---------------------------------------------------------
    // ENVÍO DEL FORMULARIO
    // ---------------------------------------------------------

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        ocultarModales();

        const musicoId = getMusicoId();
        if (!musicoId) {
            errorText.textContent = 'No se encontró un usuario autenticado.';
            mostrarModal(modalError);
            return;
        }

        const nombrePaquete = document.getElementById('nombre').value;
        const cantidadMusicos = document.getElementById('musicos') ? document.getElementById('musicos').value : "1";
        const duracionValue = document.getElementById('duracion').value;
        const precio = document.getElementById('precio').value;
        const descripcion = document.getElementById('descripcion').value;
        
        // --- NUEVO: Capturamos Elementos Incluidos ---
        const elementosIncluidos = document.getElementById('elementos').value; 

        // --- Conversión de duración ---
        let duracionHoras;
        if (duracionValue === '1h') duracionHoras = 1.0;
        else if (duracionValue === '2h') duracionHoras = 3.0;
        else if (duracionValue === '3h') duracionHoras = 5.0;
        else duracionHoras = 1.0; 

        // --- Validaciones ---
        const precioNumero = parseFloat(precio);

        // Validamos que elementosIncluidos tenga texto
        if (!nombrePaquete || !duracionValue || !precio || !descripcion || !elementosIncluidos) {
            errorText.textContent = 'Por favor, rellena todos los campos, incluidos los elementos del paquete.';
            mostrarModal(modalError);
            return;
        }

        if (isNaN(precioNumero) || precioNumero <= 0) {
            errorText.textContent = 'El precio debe ser un número válido mayor a 0.';
            mostrarModal(modalError);
            return;
        }
        
        if (descripcion.length < 50) {
            errorText.textContent = 'La descripción debe tener al menos 50 caracteres.';
            mostrarModal(modalError);
            return;
        }

        // --- Construcción del Objeto ---
        const paqueteData = {
            nombrePaquete: nombrePaquete,
            descripcion: `${descripcion}\n\n(Cantidad de músicos: ${cantidadMusicos})`,
            duracionHoras: duracionHoras,
            precioBase: precioNumero,
            activo: true,
            // --- CAMBIO AQUÍ: ---
            elementosIncluidos: elementosIncluidos, 
            // NOTA IMPORTANTE: Eliminé "ubicacionId". Asegúrate de que tu API (Backend)
            // no requiera obligatoriamente este campo, o fallará al guardar.
            // Si la API lo pide obligatorio pero no lo usas, puedes enviar un null o 1 por defecto:
            // ubicacionId: 1 
        };

        console.log('Enviando datos a la API:', paqueteData);
        
        submitButton.disabled = true;
        submitButton.textContent = 'GUARDANDO...';

        const apiUrl = `${API_URL}/musicians/${musicoId}/packages`; 

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paqueteData)
            });

            if (response.ok) {
                mostrarModal(modalExito);
                form.reset();
                setTimeout(ocultarModales, 2000);
            } else {
                const errorMsg = await response.text();
                errorText.textContent = `Error del servidor: ${errorMsg}`;
                mostrarModal(modalError);
            }
        } catch (error) {
            console.error('Error de red:', error);
            errorText.textContent = 'No se pudo conectar con el servidor.';
            mostrarModal(modalError);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'GUARDAR PAQUETE';
        }
    });

    if (btnVolverPerfil) {
        btnVolverPerfil.addEventListener('click', () => {
            window.location.href = 'menuMusico.html'; 
        });
    }
});