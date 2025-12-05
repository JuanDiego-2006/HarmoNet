const API_URL = 'http://44.217.202.87:7000';

document.addEventListener('DOMContentLoaded', async () => {
    const userData = JSON.parse(localStorage.getItem('hermonetUser'));

    if (!userData || userData.tipoUsuarioId !== 2) {
        alert("Acceso denegado. Debes ser músico.");
        window.location.href = '../index.html';
        return;
    }

    const musicoId = userData.usuarioId;
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    try {
        // Llamada a la API actualizada
        const response = await fetch(`${API_URL}/musicians/${musicoId}/stats`);
        if (!response.ok) throw new Error("Error al cargar estadísticas");
        
        const data = await response.json();
        
        // Actualizar textos de totales
        document.getElementById('total-solicitudes').textContent = data.solicitudesTotal;
        document.getElementById('total-contratos').textContent = data.contratacionesTotal;
        document.getElementById('avg-rating').textContent = data.calificacion.toFixed(1);
        renderStars(data.calificacion);

        // Renderizar Gráfica de Solicitudes (Rojo)
        renderChart('chart-solicitudes', data.solicitudesPorMes, '#ff0055', months);

        // Renderizar Gráfica de Contratos (Morado)
        renderChart('chart-contratos', data.contratosPorMes, '#9d00ff', months);

    } catch (error) {
        console.error(error);
        alert("No se pudieron cargar las estadísticas.");
    }
});

function renderChart(containerId, dataArray, color, monthsLabels) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Limpiar

    // Encontrar el valor máximo para calcular porcentajes de altura (evitar división por cero)
    const maxVal = Math.max(...dataArray, 1); 

    dataArray.forEach((value, index) => {
        // Calcular altura relativa (máximo 100%)
        const heightPercent = (value / maxVal) * 100; 
        // Asegurar que si es 0 tenga un píxel visible o nada
        const finalHeight = value === 0 ? '2px' : `${heightPercent}%`;

        const barItem = document.createElement('div');
        barItem.className = 'chart-bar-item';
        barItem.style.display = 'flex';
        barItem.style.flexDirection = 'column';
        barItem.style.alignItems = 'center';
        barItem.style.width = '8%';
        barItem.style.height = '100%';
        barItem.style.justifyContent = 'flex-end'; // Alinear barras al fondo

        barItem.innerHTML = `
            <span style="font-size: 0.7rem; color: #fff; margin-bottom: 5px;">${value}</span>
            <div class="chart-bar" style="
                width: 100%; 
                background-color: ${color}; 
                height: ${finalHeight}; 
                border-radius: 3px 3px 0 0;
                transition: height 1s ease;">
            </div>
            <span class="month" style="margin-top: 5px; color: #aaa; font-size: 0.7rem;">${monthsLabels[index]}</span>
        `;

        container.appendChild(barItem);
    });
}

function renderStars(rating) {
    const container = document.getElementById('stars-container');
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<i class="fas fa-star filled" style="color: #ffcc00;"></i>';
        } else if (i - 0.5 <= rating) {
            html += '<i class="fas fa-star-half-alt filled" style="color: #ffcc00;"></i>';
        } else {
            html += '<i class="far fa-star" style="color: #ff0055;"></i>';
        }
    }
    container.innerHTML = html;
}