const API_URL = 'http://44.217.202.87:7000';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID del contrato de la URL (ej: contrato.html?id=123)
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get('id');

    if (!contratoId) {
        alert("Error: No se especificó el número de contrato.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/contracts/${contratoId}/details`);
        
        if (!response.ok) throw new Error("No se pudo cargar la información del contrato.");
        
        const data = await response.json();
        renderContrato(data);

    } catch (error) {
        console.error(error);
        alert("Error cargando contrato: " + error.message);
    }
});

function renderContrato(data) {
    // Fechas
    const fechaFirma = new Date(data.fechaFirma || new Date()); 
    const fechaInicio = new Date(data.fechaInicio);
    const fechaFin = new Date(data.fechaFin);

    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Encabezado
    document.getElementById('headerMusicoNombre').textContent = data.nombreMusico.toUpperCase();
    document.getElementById('folioContrato').textContent = data.contratacionId;

    // Sección 1: Fecha y Cliente
    document.getElementById('diaFirma').textContent = fechaFirma.getDate();
    document.getElementById('mesFirma').textContent = meses[fechaFirma.getMonth()];
    document.getElementById('anioFirma').textContent = fechaFirma.getFullYear();
    
    document.getElementById('nombreCliente').textContent = data.nombreCliente;
    document.getElementById('telefonoCliente').textContent = data.telefonoCliente || "S/N";

    // Sección 2: Servicio
    document.getElementById('nombreMusicoBody').textContent = data.nombreMusico;
    
    // Calcular duración en horas
    const diffMs = fechaFin - fechaInicio;
    const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(1);
    document.getElementById('duracionHoras').textContent = diffHrs;

    // Formato Hora (HH:mm)
    const opcionesHora = { hour: '2-digit', minute: '2-digit' };
    document.getElementById('horaInicio').textContent = fechaInicio.toLocaleTimeString('es-MX', opcionesHora);
    document.getElementById('horaFin').textContent = fechaFin.toLocaleTimeString('es-MX', opcionesHora);

    document.getElementById('diaEvento').textContent = fechaInicio.getDate();
    document.getElementById('mesEvento').textContent = meses[fechaInicio.getMonth()];
    document.getElementById('anioEvento').textContent = fechaInicio.getFullYear();
    document.getElementById('direccionEvento').textContent = data.direccion;

    // Sección 3: Costos Numéricos
    const restante = data.montoTotal - data.anticipo;

    document.getElementById('montoTotal').textContent = formatMoney(data.montoTotal);
    document.getElementById('montoAnticipo').textContent = formatMoney(data.anticipo);
    document.getElementById('montoRestante').textContent = formatMoney(restante);

    // --- CAMBIO AQUÍ: Convertir a Letras ---
    document.getElementById('montoTotalLetras').textContent = numeroALetras(data.montoTotal); 
    document.getElementById('montoAnticipoLetras').textContent = numeroALetras(data.anticipo);
    document.getElementById('montoRestanteLetras').textContent = numeroALetras(restante);

    // Firmas
    document.getElementById('firmaMusico').textContent = data.nombreMusico;
    document.getElementById('firmaCliente').textContent = data.nombreCliente;
}

function formatMoney(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// ----------------------------------------------------------------------
// FUNCIÓN PARA CONVERTIR NÚMEROS A LETRAS (Estándar Mexicano)
// ----------------------------------------------------------------------
function numeroALetras(cantidad) {
    var numero = parseFloat(cantidad);
    if (isNaN(numero)) return "CERO PESOS 00/100 M.N.";

    var ent = Math.floor(numero);
    var cent = Math.round((numero - ent) * 100);
    var centavos = (cent < 10) ? "0" + cent : "" + cent;

    if(ent === 0) return "CERO PESOS " + centavos + "/100 M.N.";

    // Función auxiliar para bloques de 1 a 999
    function getUnidades(num) {
        switch(num) {
            case 1: return "UN";
            case 2: return "DOS";
            case 3: return "TRES";
            case 4: return "CUATRO";
            case 5: return "CINCO";
            case 6: return "SEIS";
            case 7: return "SIETE";
            case 8: return "OCHO";
            case 9: return "NUEVE";
        }
        return "";
    }

    function getDecenas(num) {
        let decena = Math.floor(num / 10);
        let unidad = num - (decena * 10);

        switch(decena) {
            case 1:
                switch(unidad) {
                    case 0: return "DIEZ";
                    case 1: return "ONCE";
                    case 2: return "DOCE";
                    case 3: return "TRECE";
                    case 4: return "CATORCE";
                    case 5: return "QUINCE";
                    default: return "DIECI" + getUnidades(unidad);
                }
            case 2:
                if(unidad === 0) return "VEINTE";
                return "VEINTI" + getUnidades(unidad);
            case 3: return "TREINTA" + (unidad > 0 ? " Y " + getUnidades(unidad) : "");
            case 4: return "CUARENTA" + (unidad > 0 ? " Y " + getUnidades(unidad) : "");
            case 5: return "CINCUENTA" + (unidad > 0 ? " Y " + getUnidades(unidad) : "");
            case 6: return "SESENTA" + (unidad > 0 ? " Y " + getUnidades(unidad) : "");
            case 7: return "SETENTA" + (unidad > 0 ? " Y " + getUnidades(unidad) : "");
            case 8: return "OCHENTA" + (unidad > 0 ? " Y " + getUnidades(unidad) : "");
            case 9: return "NOVENTA" + (unidad > 0 ? " Y " + getUnidades(unidad) : "");
            case 0: return getUnidades(unidad);
        }
        return "";
    }

    function getCentenas(num) {
        let centenas = Math.floor(num / 100);
        let decenas = num - (centenas * 100);

        switch(centenas) {
            case 1:
                if(decenas > 0) return "CIENTO " + getDecenas(decenas);
                return "CIEN";
            case 2: return "DOSCIENTOS " + getDecenas(decenas);
            case 3: return "TRESCIENTOS " + getDecenas(decenas);
            case 4: return "CUATROCIENTOS " + getDecenas(decenas);
            case 5: return "QUINIENTOS " + getDecenas(decenas);
            case 6: return "SEISCIENTOS " + getDecenas(decenas);
            case 7: return "SETECIENTOS " + getDecenas(decenas);
            case 8: return "OCHOCIENTOS " + getDecenas(decenas);
            case 9: return "NOVECIENTOS " + getDecenas(decenas);
        }
        return getDecenas(decenas);
    }

    function getMiles(num) {
        let divisor = 1000;
        let cientos = Math.floor(num / divisor);
        let resto = num - (cientos * divisor);

        let strMiles = "";
        if (cientos > 0) {
            if (cientos === 1) strMiles = "MIL";
            else strMiles = getCentenas(cientos) + " MIL";
        }

        if (resto > 0) strMiles += " " + getCentenas(resto);
        return strMiles;
    }

    function getMillones(num) {
        let divisor = 1000000;
        let millones = Math.floor(num / divisor);
        let resto = num - (millones * divisor);

        let strMillones = "";
        if (millones > 0) {
            if (millones === 1) strMillones = "UN MILLON";
            else strMillones = getCentenas(millones) + " MILLONES";
        }

        if (resto > 0) strMillones += " " + getMiles(resto);
        return strMillones;
    }

    // Lógica Principal de Conversión
    let letras = "";
    if (ent < 1000) letras = getCentenas(ent);
    else if (ent < 1000000) letras = getMiles(ent);
    else letras = getMillones(ent);

    // Limpieza de espacios y retorno con formato moneda
    return letras.trim() + " PESOS " + centavos + "/100 M.N.";
}