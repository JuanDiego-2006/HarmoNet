const API_URL = 'http://44.217.202.87:7000';

const userData = JSON.parse(localStorage.getItem('hermonetUser'));

if (!userData || userData.tipoUsuarioId !== 2) {
    alert("Debes iniciar sesión como músico para ver tu agenda.");
    window.location.href = '../index.html';
    throw new Error("Acceso denegado");
}

const CURRENT_MUSICIAN_ID = userData.usuarioId;
console.log("Cargando agenda para el músico ID:", CURRENT_MUSICIAN_ID);

const monthDisplay = document.getElementById('monthDisplay');
const calendarGrid = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentDateDisplay = document.getElementById('currentDateDisplay');
const addEventToggleBtn = document.getElementById('addEventToggleBtn');
const eventFormContainer = document.getElementById('eventFormContainer');
const eventForm = document.getElementById('eventForm');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const eventsList = document.getElementById('eventsList');

const eventDateInput = document.getElementById('eventDateInput');
const eventNameInput = document.getElementById('eventName');
const eventTimeInput = document.getElementById('eventTime');
const eventEndTimeInput = document.getElementById('eventEndTime');

// ==========================================
// 3. ESTADO
// ==========================================
let currentDate = new Date();
let selectedDate = new Date();
let allEventsCache = [];

const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

// ==========================================
// 4. INICIALIZACIÓN
// ==========================================
async function init() {
    renderCalendar();
    await fetchAndRefreshEvents();
}

window.onload = init;

// ==========================================
// 5. LÓGICA API
// ==========================================

// Obtener Agenda
async function fetchAndRefreshEvents() {
    try {
        const response = await fetch(`${API_URL}/musicians/${CURRENT_MUSICIAN_ID}/agenda`);

        if (!response.ok) throw new Error("Error al obtener agenda");

        const data = await response.json();
        allEventsCache = data;

        renderCalendar();
        updateEventsPanel(selectedDate);
    } catch (error) {
        console.error("Error API:", error);
        eventsList.innerHTML = `<p class="no-events-message error">Error conectando con el servidor.</p>`;
    }
}

// Crear Bloqueo Manual
async function createBlock(bloqueoData) {
    try {
        const response = await fetch(`${API_URL}/agenda/blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bloqueoData)
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            alert("Error al crear bloqueo: " + errorMsg);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error al crear:", error);
        alert("Error de conexión.");
        return false;
    }
}

// Eliminar Bloqueo
async function deleteBlock(bloqueoId) {
    if (!confirm("¿Estás seguro de eliminar este bloqueo?")) return;

    try {
        const response = await fetch(`${API_URL}/agenda/blocks/${bloqueoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await fetchAndRefreshEvents();
        } else {
            alert("No se pudo eliminar el bloqueo.");
        }
    } catch (error) {
        console.error("Error eliminando:", error);
        alert("Error de conexión.");
    }
}

// CONFIRMAR PAGO DEL CLIENTE (Validación del Músico)
window.validarPagoMusico = async (contratacionId, solicitudId) => {

    if (!confirm("¿Confirmas que el cliente ya realizó el pago y verificaste el comprobante?")) return;

    const referenciaConfirmacion = "CONFIRMADO_POR_MUSICO";

    try {
        // 1. Confirmar el contrato (Backend registra el pago definitivo y crea el BLOQUEO)
        const response = await fetch(`${API_URL}/contracts/${contratacionId}/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referenciaPago: referenciaConfirmacion })
        });

        if (response.ok) {
            // 2. Actualizar estado de la solicitud a 4 (Confirmado) para visualización
            await fetch(`${API_URL}/api/solicitudes/${solicitudId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estadoId: 4 })
            });

            alert("¡Evento confirmado exitosamente! El calendario se ha bloqueado.");
            await fetchAndRefreshEvents();
        } else {
            const errorText = await response.text();
            alert("Error al confirmar contrato: " + errorText);
        }
    } catch (error) {
        console.error(error);
        alert("Error de red.");
    }
};

// ==========================================
// 6. UTILIDADES DE FECHA
// ==========================================
function formatDateForDisplay(date) {
    if (isNaN(date.getTime())) return "Selecciona un día";
    return `${date.getDate()} de ${months[date.getMonth()].toLowerCase()}`;
}

function formatDbDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function extractTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// ==========================================
// 7. RENDERIZADO DEL CALENDARIO
// ==========================================

function renderCalendar() {
    while (calendarGrid.children.length > 7) {
        calendarGrid.removeChild(calendarGrid.lastChild);
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthDisplay.textContent = `${months[month]} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    let startDayIndex = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Días mes anterior
    for (let i = startDayIndex; i > 0; i--) {
        const day = prevMonthLastDay - i + 1;
        const date = new Date(year, month - 1, day);
        calendarGrid.appendChild(createDayCell(day, 'old-month', false, date));
    }

    // Días mes actual
    for (let day = 1; day <= lastDayOfMonth; day++) {
        const date = new Date(year, month, day);
        calendarGrid.appendChild(createDayCell(day, '', true, date));
    }

    // Días mes siguiente
    const totalDaysInGrid = calendarGrid.children.length - 7;
    const remainingCells = 42 - totalDaysInGrid;
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        calendarGrid.appendChild(createDayCell(day, 'next-month', false, date));
    }

    highlightSelectedDay();
    renderEventIndicators();
}

function createDayCell(day, extraClass, isCurrentMonth, date) {
    const cell = document.createElement('div');
    cell.className = `day-cell ${extraClass}`;
    const dateStr = formatDbDate(date);
    cell.setAttribute('data-date', dateStr);

    cell.innerHTML = `<div class="day-content">${day}<div class="event-indicator" id="indicator-${dateStr}"></div></div>`;

    if (isCurrentMonth) {
        cell.addEventListener('click', () => handleDayClick(date));
    }
    return cell;
}

function highlightSelectedDay() {
    document.querySelectorAll('.day-cell span.selected-day').forEach(el => {
        const txt = el.textContent;
        el.replaceWith(document.createTextNode(txt));
    });

    const targetCell = calendarGrid.querySelector(`.day-cell[data-date="${formatDbDate(selectedDate)}"]`);

    if (targetCell && !targetCell.classList.contains('old-month') && !targetCell.classList.contains('next-month')) {
        const dayContentEl = targetCell.querySelector('.day-content');
        const dayNumberNode = Array.from(dayContentEl.childNodes).find(n => n.nodeType === 3);

        if (dayNumberNode) {
            const wrapper = document.createElement('span');
            wrapper.className = 'selected-day';
            wrapper.textContent = dayNumberNode.textContent;
            dayNumberNode.replaceWith(wrapper);
        }
    }
}

function renderEventIndicators() {
    document.querySelectorAll('.event-indicator').forEach(el => el.innerHTML = '');

    allEventsCache.forEach(event => {
        const evtDate = new Date(event.fechaInicio);
        const dateKey = formatDbDate(evtDate);

        const indicatorEl = document.getElementById(`indicator-${dateKey}`);
        if (indicatorEl) {
            let dotClass = 'dot-occupied'; // Rojo por defecto (estado 4 o confirmado)

            if (event.tipo === 'BLOQUEO') {
                dotClass = 'dot-reserved'; // Bloqueo manual
            } else if (event.estadoId === 3) {
                dotClass = 'dot-pending'; // Amarillo (En espera de pago)
            }

            if (indicatorEl.innerHTML === '') {
                indicatorEl.innerHTML = `<span class="event-dot ${dotClass}"></span>`;
            }
        }
    });
}

function handleDayClick(date) {
    selectedDate = date;
    highlightSelectedDay();
    updateEventsPanel(selectedDate);

    eventFormContainer.classList.add('hidden');
    eventForm.reset();
}

function handleNavigation(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

prevMonthBtn.addEventListener('click', () => handleNavigation(-1));
nextMonthBtn.addEventListener('click', () => handleNavigation(1));

// ==========================================
// 8. PANEL DE EVENTOS (ACTUALIZADO CON BOTÓN CONTRATO)
// ==========================================

function updateEventsPanel(date) {
    currentDateDisplay.textContent = formatDateForDisplay(date);

    const isVisibleMonth = currentDate.getMonth() === date.getMonth();
    addEventToggleBtn.disabled = !isVisibleMonth;

    const dateKey = formatDbDate(date);

    const dailyEvents = allEventsCache.filter(event => {
        const evtDateKey = formatDbDate(new Date(event.fechaInicio));
        return evtDateKey === dateKey;
    });

    dailyEvents.sort((a, b) => a.fechaInicio - b.fechaInicio);

    renderDailyEventsList(dailyEvents);
}

function renderDailyEventsList(events) {
    eventsList.innerHTML = '';

    if (events.length === 0) {
        eventsList.innerHTML = `<p class="no-events-message">No hay eventos para este día.</p>`;
        return;
    }

    events.forEach(event => {
        const item = document.createElement('div');
        item.className = 'event-item';

        let borderStyle = 'border-left: 5px solid var(--color-occupied);';
        let statusText = '(Confirmado)';
        let actionButtonsHtml = ''; // Variable para botones (Confirmar pago o Ver contrato)

        if (event.tipo === 'BLOQUEO') {
            statusText = '(Bloqueo Manual)';
            borderStyle = 'border-left: 5px solid var(--color-reserved);';
        }
        else if (event.estadoId === 3) {
            borderStyle = 'border-left: 5px solid var(--color-pending);';
            statusText = '(Pendiente de Pago)';

            if (event.contratacionId && event.contratacionId > 0) {
                actionButtonsHtml = `
                    <button class="confirm-payment-btn" onclick="validarPagoMusico(${event.contratacionId}, ${event.referenciaId})" style="margin-top:10px; width:100%; background:#f1c40f; border:none; padding:8px; border-radius:5px; cursor:pointer; font-weight:bold; color:#000;">
                        <i class="fas fa-check-circle"></i> Validar Pago del Cliente
                    </button>
                `;
            } else {
                actionButtonsHtml = `<small style="color:red;">Error: Contrato no generado</small>`;
            }
        }
        // ESTADO 4: Evento Confirmado (Mostrar Botón Contrato)
        else if (event.tipo === 'EVENTO' && event.contratacionId > 0) {
             actionButtonsHtml = `
                <a href="/vistas/contrato.html?id=${event.contratacionId}" target="_blank" class="btn" style="margin-top:10px; display:block; text-align:center; background: #333; color: #fff; text-decoration: none; padding: 5px; font-size: 0.9rem;">
                    <i class="fas fa-file-contract"></i> Ver Contrato
                </a>
             `;
        }

        item.style.cssText = borderStyle;

        const deleteBtn = event.tipo === 'BLOQUEO'
            ? `<button class="delete-event-btn" onclick="deleteBlock(${event.referenciaId})" title="Eliminar bloqueo"><i class="fas fa-trash-alt"></i></button>`
            : '';

        const startTime = extractTime(event.fechaInicio);
        const endTime = extractTime(event.fechaFin);

        const icon = event.tipo === 'BLOQUEO' ? 'fa-lock' : 'fa-music';

        item.innerHTML = `
            ${deleteBtn}
            <strong><i class="fas ${icon}"></i> ${event.titulo}</strong>
            <div class="event-time"><i class="fas fa-clock"></i> ${startTime} - ${endTime}</div>
            <div style="font-size:0.8rem; color:#ccc; margin-top:5px;">${statusText}</div>
            ${actionButtonsHtml}
        `;
        eventsList.appendChild(item);
    });
}

// ==========================================
// 9. FORMULARIO (CREAR BLOQUEO)
// ==========================================

addEventToggleBtn.addEventListener('click', () => {
    const isHidden = eventFormContainer.classList.contains('hidden');
    if (isHidden) {
        eventFormContainer.classList.remove('hidden');
        eventDateInput.value = formatDbDate(selectedDate);
        eventNameInput.focus();
    } else {
        eventFormContainer.classList.add('hidden');
        eventForm.reset();
    }
});

cancelFormBtn.addEventListener('click', () => {
    eventFormContainer.classList.add('hidden');
    eventForm.reset();
});

eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dateStr = eventDateInput.value;
    const startTimeStr = eventTimeInput.value;
    const endTimeStr = eventEndTimeInput.value;

    const startDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
    const endDateTime = new Date(`${dateStr}T${endTimeStr}:00`);

    if (endDateTime <= startDateTime) {
        alert("La hora de finalización debe ser posterior a la de inicio.");
        return;
    }

    const newBlock = {
        musicoId: CURRENT_MUSICIAN_ID,
        fechaInicio: startDateTime.getTime(),
        fechaFin: endDateTime.getTime(),
        motivo: eventNameInput.value.trim()
    };

    const submitBtn = eventForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";

    const success = await createBlock(newBlock);

    submitBtn.disabled = false;
    submitBtn.textContent = "Guardar";

    if (success) {
        eventFormContainer.classList.add('hidden');
        eventForm.reset();
        await fetchAndRefreshEvents();
    }
});