const API_URL = 'http://44.217.202.87:7000';

let citiesCache = [];

document.addEventListener('DOMContentLoaded', async () => {
    const listaSolicitudes = document.getElementById('listaSolicitudes');
    const userData = JSON.parse(localStorage.getItem('hermonetUser'));

    const requestModal = document.getElementById('requestModal');
    const modalTitle = document.getElementById('modalReqTitle');
    const modalDate = document.getElementById('modalReqDate');
    const modalDuration = document.getElementById('modalReqDuration');
    const modalCity = document.getElementById('modalReqCity');
    const modalClient = document.getElementById('modalReqClient');
    const modalDesc = document.getElementById('modalReqDescription');
    const btnRechazar = document.getElementById('btnModalRechazar');
    const btnCotizar = document.getElementById('btnModalCotizar');

    if (!userData || userData.tipoUsuarioId !== 2) {
        alert("Debes ser un músico para ver esta sección.");
        window.location.href = '../index.html';
        return;
    }

    async function cargarCiudades() {
        try {
            const res = await fetch(`${API_URL}/catalog/cities`);
            if (res.ok) citiesCache = await res.json();
        } catch (e) { console.error("Error cargando ciudades", e); }
    }

    async function cargarNotificaciones() {
        try {
            listaSolicitudes.innerHTML = '<p style="text-align: center; color: #aaa;">Cargando...</p>';

            if (citiesCache.length === 0) await cargarCiudades();

            const response = await fetch(`${API_URL}/api/solicitudes/my-requests?userId=${userData.usuarioId}&userType=${userData.tipoUsuarioId}`);
            if (!response.ok) throw new Error("Error al obtener solicitudes");
            const solicitudes = await response.json();

            const urlContratos = `${API_URL}/contracts/my-contracts?userId=${userData.usuarioId}&userType=${userData.tipoUsuarioId}`;
            console.log("Consultando contratos en:", urlContratos); // DEBUG: Verás en consola si la URL va vacía

            const resCon = await fetch(urlContratos);

            if (!resCon.ok) {
                const errorTexto = await resCon.text();
                console.error("Error servidor contratos:", errorTexto);
                throw new Error("Error cargando contratos: " + errorTexto);
            }

            const contratos = await resCon.json();

            renderizarSolicitudes(solicitudes, contratos);

        } catch (error) {
            console.error(error);
            listaSolicitudes.innerHTML = `<p style="color: red; text-align: center;">Error: ${error.message}</p>`;
        }
    }

    function renderizarSolicitudes(solicitudes, contratos) {
        listaSolicitudes.innerHTML = '';

        const pendientes = solicitudes.filter(s => s.estadoId === 1 || s.estadoId === 2 || s.estadoId === 3);

        if (pendientes.length === 0) {
            listaSolicitudes.innerHTML = `<p style="color: #aaa; text-align: center;">No tienes solicitudes pendientes de acción.</p>`;
            return;
        }

        pendientes.forEach(solicitud => {
            const fechaObj = new Date(solicitud.fechaEventoDeseada);
            const fechaTexto = fechaObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            const ciudadObj = citiesCache.find(c => c.ciudadId === solicitud.ciudadEventoId);
            const ciudadNombre = ciudadObj ? `${ciudadObj.nombre} (${ciudadObj.estadoOProvincia})` : "Ubicación desconocida";

            const contrato = contratos.find(c => new Date(c.fechaEventoInicio).getTime() === new Date(solicitud.fechaEventoDeseada).getTime());

            let statusHtml = '';
            let accionesHtml = '';

            if (solicitud.estadoId === 3 && contrato) {
                if (contrato.referenciaPago) {
                    statusHtml = `<p style="color: #f1c40f; font-weight: bold;"><i class="fas fa-exclamation-circle"></i> Pago Enviado por Cliente</p>`;
                    accionesHtml = `
                        <div style="background: #222; padding: 10px; border-radius: 5px; margin-bottom: 10px; font-size: 0.9rem;">
                            <p style="color: #aaa; margin:0;">Clave de Rastreo:</p>
                            <p style="color: #fff; font-family: monospace; font-size: 1.1rem;">${contrato.referenciaPago}</p>
                        </div>
                        <button class="accept-btn" style="width: 100%; justify-content: center;" onclick="confirmarPagoMusico(${contrato.contratacionId}, ${solicitud.solicitudId})">
                            <i class="fas fa-check-circle"></i> Confirmar Recepción
                        </button>
                    `;
                } else {
                    statusHtml = `<p style="color: #e67e22;"><i class="fas fa-hourglass-half"></i> Esperando pago del cliente...</p>`;
                }
            } else {
                accionesHtml = `
                    <button class="view-btn" onclick='window.openModal(${JSON.stringify(solicitud)}, "${fechaTexto}", "${ciudadNombre}")'>
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <button class="accept-btn" onclick="responderSolicitud(${solicitud.solicitudId}, 'ACEPTAR')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="reject-btn" onclick="responderSolicitud(${solicitud.solicitudId}, 'RECHAZAR')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }

            const detallesCortos = solicitud.detallesPeticion.length > 80
                ? solicitud.detallesPeticion.substring(0, 80) + "..."
                : solicitud.detallesPeticion;

            const card = document.createElement('div');
            card.className = 'solicitud-card';
            card.innerHTML = `
                <div class="details">
                    <p><strong style="color: #D946EF;">Solicitud #${solicitud.solicitudId}</strong></p>
                    <p><i class="fas fa-calendar"></i> ${fechaTexto}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${ciudadNombre}</p>
                    <p class="preview-text">"${detallesCortos}"</p>
                    ${statusHtml}
                </div>
                <div class="actions" style="min-width: 160px;">
                    ${accionesHtml}
                </div>
            `;
            listaSolicitudes.appendChild(card);
        });
    }

    window.openModal = (solicitud, fechaTexto, ciudadNombre) => {
        modalTitle.textContent = `Solicitud #${solicitud.solicitudId}`;
        modalDate.textContent = fechaTexto;
        modalDuration.textContent = `${solicitud.duracionEstimadaHoras} Horas`;
        modalCity.textContent = ciudadNombre;
        modalClient.textContent = solicitud.clienteId;
        modalDesc.textContent = solicitud.detallesPeticion;

        btnRechazar.onclick = () => {
            window.responderSolicitud(solicitud.solicitudId, 'RECHAZAR');
            closeRequestModal();
        };
        btnCotizar.onclick = () => {
            window.responderSolicitud(solicitud.solicitudId, 'ACEPTAR');
            closeRequestModal();
        };

        requestModal.classList.remove('hidden');
        if (solicitud.estadoId === 1) silentUpdateStatus(solicitud.solicitudId, 2);
    };

    window.closeRequestModal = () => requestModal.classList.add('hidden');
    window.onclick = (event) => { if (event.target === requestModal) closeRequestModal(); };

    async function silentUpdateStatus(id, status) {
        try {
            await fetch(`${API_URL}/api/solicitudes/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estadoId: status })
            });
        } catch (e) { }
    }

    window.confirmarPagoMusico = async (contratoId, solicitudId) => {
        if (!confirm("¿Confirmas que has recibido el pago en tu cuenta?")) return;

        try {
            const resCon = await fetch(`${API_URL}/contracts/${contratoId}/confirm-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referenciaPago: "CONFIRMADO_POR_MUSICO" })
            });

            if (resCon.ok) {
                await fetch(`${API_URL}/api/solicitudes/${solicitudId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estadoId: 4 })
                });

                alert("¡Pago confirmado y evento agendado!");
                cargarNotificaciones();
            } else {
                alert("Error al confirmar el contrato.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de red.");
        }
    };

    window.responderSolicitud = async (id, accion) => {
        let nuevoEstado = 1;
        let confirmMsg = "";

        if (accion === 'RECHAZAR') {
            if (!confirm(`¿Seguro que deseas rechazar?`)) return;
            nuevoEstado = 5;
            confirmMsg = "Solicitud rechazada.";
        }
        if (accion === 'ACEPTAR') {
            nuevoEstado = 3;
            confirmMsg = "Solicitud Aceptada. Esperando pago del cliente.";
        }
        try {
            const response = await fetch(`${API_URL}/api/solicitudes/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estadoId: nuevoEstado })
            });

            if (response.ok) {
                alert(confirmMsg);
                cargarNotificaciones();
            } else {
                alert("Error al actualizar.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de red.");
        }
    };

    cargarNotificaciones();
});