const API_URL = 'http://44.217.202.87:7000';

document.addEventListener('DOMContentLoaded', async function () {
    console.log('=== SCRIPT FORMULARIO COTIZACIÓN CARGADO ===');

    const quoteForm = document.getElementById('quoteForm');
    const successAlert = document.getElementById('successAlert');
    const mainContent = document.querySelector('.main-content-cotizacion');

    // Referencias UI
    const paqueteSelect = document.getElementById('paqueteSelect');
    const ciudadSelect = document.getElementById('ciudadSelect');
    const durationInput = document.getElementById('duration');
    const summaryDiv = document.getElementById('costSummary');
    const displayPackage = document.getElementById('displayPackagePrice');
    const displayTransport = document.getElementById('displayTransportPrice');
    const displayTotal = document.getElementById('displayTotal');
    
    // Referencias nuevas para autocompletado y validación
    const clientNameInput = document.getElementById('clientName');
    const clientPhoneInput = document.getElementById('clientPhone');
    const contactEmailInput = document.getElementById('contactEmail');
    const eventDateInput = document.getElementById('eventDate');

    // ------------------------------------------------------------------
    // 1. RESTRICCION DE FECHA: No permitir fechas anteriores a hoy
    // ------------------------------------------------------------------
    const today = new Date();
    // Formato YYYY-MM-DD para el atributo min
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;
    
    if (eventDateInput) {
        eventDateInput.setAttribute('min', minDate);
    }

    // ------------------------------------------------------------------
    // 2. AUTOCOMPLETADO DE DATOS (Nombre, Teléfono, Correo)
    // ------------------------------------------------------------------
    const userData = JSON.parse(localStorage.getItem('hermonetUser'));
    
    if (userData) {
        // Autocompletamos si existen los datos
        if(contactEmailInput) contactEmailInput.value = userData.email || '';
        
        // Intentamos obtener nombre y teléfono del objeto guardado
        // Nota: Ajusta 'nombreCompleto' o 'telefono' según como lo guardes en tu login
        if(clientNameInput) clientNameInput.value = userData.nombreCompleto || userData.nombre || ''; 
        if(clientPhoneInput) clientPhoneInput.value = userData.telefono || userData.phoneNumber || '';
    }

    // Variables de estado para precios
    let currentPackagePrice = 0;
    let currentTransportCost = 0;
    let musicianBaseCityId = null;

    // 1. OBTENER ID DEL MÚSICO DE LA URL
    const urlParams = new URLSearchParams(window.location.search);
    const musicoId = urlParams.get('id');

    if (!musicoId) {
        alert("Error: No se especificó un músico para cotizar.");
        window.location.href = '../index.html';
        return;
    }

    let paquetesCargados = [];

    // --- FUNCIÓN HELPER PARA ACTUALIZAR TOTALES ---
    function updatePriceDisplay() {
        // Mostrar el resumen si hay costos
        summaryDiv.classList.remove('hidden');

        const total = currentPackagePrice + currentTransportCost;

        // Formatear a moneda
        const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        displayPackage.textContent = formatter.format(currentPackagePrice);
        displayTransport.textContent = formatter.format(currentTransportCost);

        // Cambiar el color del transporte si es 0 pero es otra ciudad (aviso visual)
        const ciudadSeleccionada = parseInt(ciudadSelect.value);
        if (ciudadSeleccionada && musicianBaseCityId && ciudadSeleccionada !== musicianBaseCityId && currentTransportCost === 0) {
            displayTransport.textContent = "A convenir (Sin precio en sistema)";
            displayTransport.style.color = "orange";
        } else {
            displayTransport.style.color = ""; // Reset color
        }

        displayTotal.textContent = formatter.format(total);
    }

    // 2. CARGAR DATOS
    async function cargarDatos() {
        try {
            // A) CARGAR PERFIL DEL MÚSICO
            const musicoResp = await fetch(`${API_URL}/musicians/${musicoId}`);
            if (musicoResp.ok) {
                const perfil = await musicoResp.json();
                musicianBaseCityId = perfil.ubicacionPrincipalId;
                console.log("Ciudad base del músico ID:", musicianBaseCityId);
            }

            // B) Cargar Paquetes
            const paquetesResp = await fetch(`${API_URL}/musicians/${musicoId}/packages`);
            if (paquetesResp.ok) {
                const paquetes = await paquetesResp.json();
                paquetesCargados = paquetes;

                paqueteSelect.innerHTML = '<option value="">-- Selecciona un paquete (Opcional) --</option>';

                if (paquetes.length === 0) {
                    const option = document.createElement('option');
                    option.text = "Este músico no tiene paquetes predefinidos";
                    paqueteSelect.add(option);
                    paqueteSelect.disabled = true;
                    
                    // Si no hay paquetes, permitimos editar duración manualmente
                    durationInput.readOnly = false;
                    durationInput.style.backgroundColor = ""; 
                    durationInput.style.cursor = "text";
                } else {
                    paquetes.forEach(pkg => {
                        const option = document.createElement('option');
                        option.value = pkg.paqueteId;
                        option.text = `${pkg.nombrePaquete} - $${pkg.precioBase} (${pkg.duracionHoras}h)`;
                        paqueteSelect.add(option);
                    });
                }
            }

            // C) Cargar Ciudades
            const ciudadesResp = await fetch(`${API_URL}/catalog/cities`);
            if (ciudadesResp.ok) {
                const ciudades = await ciudadesResp.json();
                ciudadSelect.innerHTML = '<option value="">-- Selecciona la ciudad del evento --</option>';

                ciudades.forEach(city => {
                    const option = document.createElement('option');
                    option.value = city.ciudadId;

                    // Visualmente indicamos cuál es la ciudad local
                    let suffix = "";
                    if (musicianBaseCityId && city.ciudadId === musicianBaseCityId) {
                        suffix = " (Local - Sin costo extra)";
                    }

                    option.text = `${city.nombre} (${city.estadoOProvincia})${suffix}`;
                    ciudadSelect.add(option);
                });
            }

        } catch (error) {
            console.error("Error cargando datos iniciales:", error);
        }
    }

    // 3. EVENTO: CAMBIO DE PAQUETE (BLOQUEO DE DURACIÓN)
    paqueteSelect.addEventListener('change', function () {
        const selectedId = this.value;
        const paquete = paquetesCargados.find(p => p.paqueteId == selectedId);

        if (paquete) {
            // Seteamos la duración del paquete y la bloqueamos visualmente
            durationInput.value = paquete.duracionHoras;
            durationInput.readOnly = true; 
            durationInput.style.backgroundColor = "#333";
            durationInput.style.cursor = "not-allowed";
            
            currentPackagePrice = paquete.precioBase;

            // Efecto visual de cambio
            durationInput.style.borderColor = "#d946ef";
            setTimeout(() => durationInput.style.borderColor = "#333", 500);
        } else {
            // Si se deselecciona, limpiamos precio
            currentPackagePrice = 0;
            // Opcional: Si quieres permitir editar duración cuando NO hay paquete seleccionado:
            // durationInput.readOnly = false;
            // durationInput.style.backgroundColor = "";
            // durationInput.style.cursor = "text";
        }

        updatePriceDisplay();
    });

    // 4. EVENTO: CAMBIO DE CIUDAD
    ciudadSelect.addEventListener('change', async function () {
        const ciudadSeleccionadaId = parseInt(this.value);

        if (!ciudadSeleccionadaId) {
            currentTransportCost = 0;
            updatePriceDisplay();
            return;
        }

        if (musicianBaseCityId && ciudadSeleccionadaId === musicianBaseCityId) {
            console.log("Evento en ciudad local. Costo traslado = 0.");
            currentTransportCost = 0;
            updatePriceDisplay();
            return;
        }

        try {
            console.log(`Consultando costo de traslado para ciudad ID: ${ciudadSeleccionadaId}...`);
            const url = `${API_URL}/musicians/${musicoId}/zones/cost?ciudadId=${ciudadSeleccionadaId}`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                currentTransportCost = data.costoTraslado || 0;

                if (currentTransportCost === 0) {
                    console.warn("La API devolvió 0. El músico no tiene configurada esta zona en ZONA_SERVICIO.");
                }
            } else {
                currentTransportCost = 0;
            }
        } catch (error) {
            console.error("Error de red al obtener costo:", error);
            currentTransportCost = 0;
        }

        updatePriceDisplay();
    });

    // Iniciar carga de datos
    await cargarDatos();

    // 5. ENVÍO DEL FORMULARIO
    quoteForm.onsubmit = async function (e) {
        e.preventDefault();

        if (!userData) {
            alert("Debes iniciar sesión para solicitar una cotización.");
            window.location.href = 'regitro.html'; // Asegúrate que el nombre del archivo sea correcto (regitro o registro)
            return;
        }

        // Obtener valores del formulario
        const horaEvento = document.getElementById('eventTime').value;
        const direccionEvento = document.getElementById('eventAddress').value;
        let detallesUsuario = document.getElementById('details').value;
        
        // NUEVO: Capturar los datos de contacto del formulario
        const nombreContacto = clientNameInput ? clientNameInput.value : userData.nombreCompleto;
        const telContacto = clientPhoneInput ? clientPhoneInput.value : userData.telefono;
        const mailContacto = contactEmailInput ? contactEmailInput.value : userData.email;

        // Construir texto combinado incluyendo la info de contacto nueva
        let detallesFinales = `
--- DATOS DE CONTACTO ---
👤 Nombre: ${nombreContacto}
📞 Teléfono: ${telContacto}
📧 Email: ${mailContacto}

--- DATOS ESPECÍFICOS ---
📅 Hora de Inicio: ${horaEvento}
📍 Dirección Exacta: ${direccionEvento}

--- MENSAJE DEL CLIENTE ---
${detallesUsuario}
        `.trim();

        const selectedPaqueteId = paqueteSelect.value;
        const ciudadSeleccionadaId = parseInt(ciudadSelect.value);

        // Resumen económico
        let resumenEconomico = `\n\n--- DETALLE DE COSTOS ESTIMADOS ---\n`;

        if (currentPackagePrice > 0) {
            resumenEconomico += `Paquete Base: $${currentPackagePrice}\n`;
        }

        if (currentTransportCost > 0) {
            resumenEconomico += `Costo Traslado: $${currentTransportCost}\n`;
        } else if (ciudadSeleccionadaId === musicianBaseCityId) {
            resumenEconomico += `Costo Traslado: $0 (Evento Local)\n`;
        } else {
            resumenEconomico += `Costo Traslado: A CONVENIR (Zona no tabulada)\n`;
        }

        resumenEconomico += `Total Estimado: $${currentPackagePrice + currentTransportCost}`;

        if (selectedPaqueteId) {
            const paquete = paquetesCargados.find(p => p.paqueteId == selectedPaqueteId);
            if (paquete) {
                const infoPaquete = `[PAQUETE SELECCIONADO: ${paquete.nombrePaquete}]`;
                detallesFinales = `${infoPaquete}\n${detallesFinales}`;
            }
        }

        detallesFinales += resumenEconomico;

        // --- MANEJO DE FECHA Y HORA ---
        // 1. Obtener valores del formulario
        const rawDate = document.getElementById('eventDate').value; // "2025-10-27"
        const rawTime = document.getElementById('eventTime').value; // "20:30"

        // 2. Parsear fecha y hora por separado
        const [anio, mes, dia] = rawDate.split('-').map(Number);
        const [hora, minuto] = rawTime.split(':').map(Number);

        // 3. Crear la fecha usando LA HORA SELECCIONADA por el usuario
        // Mes en Date empieza en 0 (Enero = 0)
        const fechaAjustada = new Date(anio, mes - 1, dia, hora, minuto, 0);

        console.log("Fecha enviada al backend:", fechaAjustada.toString());

        const solicitudData = {
            clienteId: userData.usuarioId,
            musicoId: parseInt(musicoId),
            fechaEventoDeseada: fechaAjustada.getTime(),
            duracionEstimadaHoras: parseFloat(document.getElementById('duration').value),
            ciudadEventoId: ciudadSeleccionadaId,
            detallesPeticion: detallesFinales, // Aquí va toda la info nueva
            estadoId: 1
        };

        try {
            const response = await fetch(`${API_URL}/api/solicitudes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(solicitudData)
            });

            if (response.ok) {
                mainContent.style.display = 'none';
                successAlert.classList.add('active');
            } else if (response.status === 409) {
                const errorText = await response.text();
                alert('⚠️ FECHA NO DISPONIBLE: ' + errorText);
            } else {
                const errorText = await response.text();
                alert('Error al enviar solicitud: ' + errorText);
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert('Error de conexión al enviar la solicitud.');
        }
    };

    successAlert.onclick = function () {
        window.history.back();
    };
});