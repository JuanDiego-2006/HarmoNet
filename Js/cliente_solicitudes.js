const API_URL = 'http://44.217.202.87:7000';
let currentContratoId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const lista = document.getElementById('listaSolicitudesCliente');
    const userData = JSON.parse(localStorage.getItem('hermonetUser'));

    if (!userData || userData.tipoUsuarioId !== 1) {
        alert("Acceso solo para clientes.");
        window.location.href = '../index.html';
        return;
    }

    async function cargarSolicitudes() {
        try {
            const resSol = await fetch(`${API_URL}/api/solicitudes/my-requests?userId=${userData.usuarioId}&userType=1`);
            const solicitudes = await resSol.json();

            const resCon = await fetch(`${API_URL}/contracts/my-contracts?userId=${userData.usuarioId}&userType=1`);
            const contratos = await resCon.json();

            console.log("Contratos recuperados del servidor:", contratos);

            renderizar(solicitudes, contratos);
        } catch (e) {
            console.error("Error fatal cargando datos:", e);
            lista.innerHTML = '<p>Error de conexión al cargar solicitudes.</p>';
        }
    }

    function extraerPrecioDeDetalles(texto) {
        if (!texto) return 0;
        const match = texto.match(/Total Estimado:\s*\$([\d,]+(\.\d{1,2})?)/);
        if (match && match[1]) {
            return parseFloat(match[1].replace(/,/g, ''));
        }
        return 0;
    }

    function renderizar(solicitudes, contratos) {
        lista.innerHTML = '';
        const solicitudesVisibles = solicitudes.filter(s => s.estadoId !== 5);

        if (solicitudesVisibles.length === 0) {
            lista.innerHTML = '<p>No tienes solicitudes activas.</p>';
            return;
        }

        solicitudesVisibles.forEach(sol => {
            let estadoTexto = "Enviada";
            let color = "#aaa";
            let contenidoAdicional = "";

            let contrato = contratos.find(c => c.solicitudId == sol.solicitudId);
            if (!contrato) {
                const d1 = new Date(sol.fechaEventoDeseada);
                contrato = contratos.find(c => {
                    const d2 = new Date(c.fechaEventoInicio);
                    return d1.getFullYear() === d2.getFullYear() &&
                        d1.getMonth() === d2.getMonth() &&
                        d1.getDate() === d2.getDate();
                });
            }

            // --- ESTADO 4: CONFIRMADO (RESEÑA Y CONTRATO) ---
            if (sol.estadoId === 4) {
                estadoTexto = "Confirmado (Evento Agendado)";
                color = "#2ecc71";

                if (contrato && !contrato.esVirtual) {
                    contenidoAdicional = `
                    <div style="margin-top: 15px; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #2ecc71;">
                        <p style="color: #fff; margin-bottom: 10px; text-align: center;">
                            <i class="fas fa-check-circle" style="color: #2ecc71;"></i> ¡El evento está confirmado!
                        </p>
                        
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <a href="/vistas/contrato.html?id=${contrato.contratacionId}" target="_blank" class="accept-btn" style="flex: 1; text-align:center; text-decoration:none; display: flex; align-items: center; justify-content: center; background-color: #333; border: 1px solid #2ecc71; color: #2ecc71;">
                                <i class="fas fa-file-contract" style="margin-right: 5px;"></i> Ver Contrato
                            </a>

                            <button class="btn-rate" style="flex: 1; justify-content: center;" onclick="window.abrirModalResena(${contrato.contratacionId})">
                                <i class="fas fa-star" style="margin-right: 5px;"></i> Calificar
                            </button>
                        </div>
                    </div>`;
                } else {
                    contenidoAdicional = `<div style="margin-top:15px; color:#aaa; font-size:0.9em;">(Contrato no sincronizado para reseña)</div>`;
                }
            }

            // Generación de contrato virtual temporal si no existe
            if (!contrato && sol.estadoId === 3) {
                const precioReal = extraerPrecioDeDetalles(sol.detallesPeticion);
                contrato = {
                    contratacionId: sol.solicitudId, // ID temporal
                    montoTotal: precioReal,
                    estadoId: 1,
                    referenciaPago: null,
                    esVirtual: true
                };
            }

            // ESTADOS BÁSICOS
            if (sol.estadoId === 1) { estadoTexto = "Enviada (Esperando lectura)"; color = "#3498db"; }
            if (sol.estadoId === 2) { estadoTexto = "Visto por el músico"; color = "#f1c40f"; }

            // ESTADO 3: ACEPTADA (PAGO)
            if (sol.estadoId === 3) {
                estadoTexto = "¡ACEPTADA! - Requiere Pago";
                color = "#e67e22";

                if (contrato) {
                    const montoTotal = contrato.montoTotal;
                    const anticipo = montoTotal * 0.40;
                    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

                    if (montoTotal > 0) {
                        contenidoAdicional = `
                            <div style="margin-top: 15px; background: #161616; padding: 20px; border-radius: 10px; border: 1px solid #D946EF;">
                                <div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
                                    <h4 style="color: #D946EF; margin: 0;">Datos para Transferencia</h4>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                                    <div><p style="color: #aaa; margin:0;">Banco:</p><p style="color: #fff; font-weight: bold;">Mercado Pago</p></div>
                                    <div><p style="color: #aaa; margin:0;">CLABE:</p><p style="color: #fff; font-weight: bold; font-family: monospace;">722969020049608312</p></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 1.1em; padding-top: 5px; border-top: 1px solid #444;">
                                    <span style="color: #D946EF;">Anticipo (40%):</span>
                                    <span style="color: #2ecc71; font-weight: bold;">${formatter.format(anticipo)}</span>
                                </div>
                                <div>${renderInputPago(contrato)}</div>
                            </div>`;
                    } else {
                        contenidoAdicional = `<div style="margin-top:10px; color:orange;">Precio pendiente de definir.</div>`;
                    }

                    if (contrato.referenciaPago) {
                        estadoTexto = "Pago enviado (Esperando confirmación)";
                        color = "#9b59b6";
                    }
                }
            }

            if (sol.estadoId === 5) { estadoTexto = "Rechazada"; color = "#e74c3c"; }

            const fecha = new Date(sol.fechaEventoDeseada).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const card = document.createElement('div');
            card.className = 'solicitud-card';
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.gap = "10px";

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 10px; width: 100%;">
                    <div>
                        <p style="margin: 0; font-size: 1.2em; color: #fff;"><strong>Solicitud #${sol.solicitudId}</strong></p>
                        <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #aaa;"><i class="fas fa-calendar-alt"></i> ${fecha}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="background-color: ${color}20; color: ${color}; padding: 5px 10px; border-radius: 15px; font-size: 0.85em; font-weight: bold; border: 1px solid ${color};">
                            ${estadoTexto}
                        </span>
                    </div>
                </div>
                <div style="width: 100%;">
                    ${contenidoAdicional}
                </div>
            `;
            lista.appendChild(card);
        });
    }

    function renderInputPago(contrato) {
        if (contrato.referenciaPago && contrato.estadoId !== 2) {
            return `<p style="color: #f1c40f; font-size: 0.85em; margin-top: 10px; text-align: center;">
                    <i class="fas fa-clock"></i> Clave enviada: <b>${contrato.referenciaPago}</b>. Esperando validación...
                </p>`;
        } else if (contrato.estadoId === 2) {
            return `<div style="margin-top:10px; color:#2ecc71; text-align:center; font-weight:bold;">¡PAGO CONFIRMADO!</div>`;
        } else {
            return `
                <label style="display: block; color: #ccc; font-size: 0.9em; margin-bottom: 8px;">Clave de Rastreo / Folio:</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="input-ref-${contrato.contratacionId}" placeholder="Ej: 12345678ABC" 
                        style="flex: 1; padding: 10px; border-radius: 5px; border: 1px solid #555; background: #000; color: #fff;">
                    <button class="accept-btn" onclick="window.enviarReferencia(${contrato.contratacionId}, ${contrato.esVirtual})">Enviar</button>
                </div>`;
        }
    }

    // --- FUNCIONES GLOBALES ---

    window.enviarReferencia = async (contratoId, esVirtual) => {
        const inputRef = document.getElementById(`input-ref-${contratoId}`);
        const referencia = inputRef.value.trim();
        if (!referencia) return alert("Ingresa la clave.");

        if (esVirtual) {
            alert("Comprobante registrado (Simulación).");
            window.location.reload();
            return;
        }

        try {
            const res = await fetch(`${API_URL}/contracts/${contratoId}/register-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referenciaPago: referencia })
            });
            if (res.ok) {
                alert("Comprobante enviado.");
                cargarSolicitudes();
            } else {
                alert("Error enviando referencia.");
            }
        } catch (e) { console.error(e); alert("Error de conexión."); }
    };

    window.abrirModalResena = (contratoId) => {
        currentContratoId = contratoId;
        document.getElementById('modalResena').classList.remove('hidden');
        window.setRating(0);
        document.getElementById('comentarioResena').value = "";
    };

    window.cerrarModalResena = () => {
        document.getElementById('modalResena').classList.add('hidden');
        currentContratoId = null;
    };

    window.setRating = (val) => {
        document.getElementById('ratingValue').value = val;
        document.querySelectorAll('.star-rating-input i').forEach(star => {
            const sVal = parseInt(star.getAttribute('data-value'));
            if (sVal <= val) {
                star.classList.remove('far'); star.classList.add('fas', 'active');
            } else {
                star.classList.remove('fas', 'active'); star.classList.add('far');
            }
        });
    };

    window.enviarResena = async () => {
        const calificacion = document.getElementById('ratingValue').value;
        const comentario = document.getElementById('comentarioResena').value;

        if (calificacion == 0) return alert("Selecciona una calificación.");

        try {
            const response = await fetch(`${API_URL}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contratacionId: currentContratoId,
                    calificacion: parseInt(calificacion),
                    comentario: comentario
                })
            });

            if (response.ok) {
                alert("¡Reseña enviada!");
                window.cerrarModalResena();
            } else {
                const txt = await response.text();
                alert("Error: " + txt);
            }
        } catch (e) { console.error(e); alert("Error de conexión."); }
    };

    cargarSolicitudes();
});