window.addEventListener('load', function () {
    console.log('=== SCRIPT CARGADO ===');

    const API_URL = 'http://44.217.202.87:7000';

    const cardsSection = document.getElementById('cardsSection');
    const noResults = document.getElementById('noResults');
    const genreFilterContainer = document.getElementById('genreFilterContainer'); // Contenedor de checkboxes

    // --- VARIABLES GLOBALES ---
    let globalMusicians = []; 
    
    var musicianPromptOverlay = document.getElementById('musicianPromptOverlay');
    var btnPromptNo = document.getElementById('btnPromptNo');
    var promptCloseBtn = document.getElementById('promptCloseBtn');
    var btnPromptYes = document.getElementById('btnPromptYes');
    var bellIcon = document.querySelector('.bell-icon');

    // Modal Cliente
    var modalOverlayCliente = document.getElementById('modal-usuario-perfil-cliente');
    var modalCloseBtnCliente = document.getElementById('modal-usuario-cerrar-cliente');
    var modalUserNameCliente = document.getElementById('modal-nombre-usuario-cliente');
    var modalUserEmailCliente = document.getElementById('modal-email-usuario-cliente');
    var modalUserTypeCliente = document.getElementById('modal-tipo-usuario-cliente');

    // Filtros
    var searchInput = document.getElementById('searchInput');
    var filterBtn = document.getElementById('filterToggleBtn');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('overlay');
    var closeBtn = document.getElementById('closeFilters');
    var searchBorder = document.getElementById('searchBorder');
    // var genreFilters = document.querySelectorAll('.genre-filter'); // YA NO SE USA ASÍ, AHORA ES DINÁMICO
    var locationFilter = document.getElementById('locationFilter');
    var minPriceInput = document.getElementById('minPrice');
    var maxPriceInput = document.getElementById('maxPrice');
    var ratingFilter = document.getElementById('ratingFilter');

    // Modal de Detalles
    var modalOverlay = document.getElementById('modalOverlay');
    var btnModalBack = document.getElementById('btnModalBack');

    // --- FUNCIÓN PARA OBTENER TIPO DE USUARIO ---
    function getUserData() {
        const data = localStorage.getItem('hermonetUser');
        return data ? JSON.parse(data) : null;
    }

    // --- NUEVO: CARGAR GÉNEROS DESDE API ---
    async function loadGenres() {
        try {
            const response = await fetch(`${API_URL}/catalog/genres`);
            if (response.ok) {
                const genres = await response.json();
                genreFilterContainer.innerHTML = ''; // Limpiar mensaje de carga

                genres.forEach(genre => {
                    // Crear estructura: <label class="checkbox-item"><input...> <span>Nombre</span></label>
                    const label = document.createElement('label');
                    label.className = 'checkbox-item';

                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.value = genre.nombre; // El valor es el nombre real (ej: "Norteño")
                    input.className = 'genre-filter';
                    input.addEventListener('change', applyFilters); // Re-conectar evento

                    const span = document.createElement('span');
                    span.textContent = genre.nombre;

                    label.appendChild(input);
                    label.appendChild(span);
                    genreFilterContainer.appendChild(label);
                });
            }
        } catch (error) {
            console.error("Error cargando géneros:", error);
            genreFilterContainer.innerHTML = '<p style="color:red; font-size:0.8em;">Error al cargar géneros</p>';
        }
    }

    // --- CARGA DE MÚSICOS ---
    async function fetchMusicians() {
        cardsSection.innerHTML = '<p class="loading-message" style="width: 100%; text-align: center; color: #aaa;">Cargando músicos...</p>';
        try {
            const response = await fetch(`${API_URL}/musicians`);

            if (!response.ok) {
                throw new Error('Error al obtener la lista de músicos.');
            }

            globalMusicians = await response.json();
            
            // Inicialmente mostramos solo los primeros 6
            const topMusicians = globalMusicians.slice(0, 6); 
            renderMusicianCards(topMusicians);

        } catch (error) {
            console.error('Error fatal al cargar músicos:', error);
            cardsSection.innerHTML = `<p class="loading-message" style="color: #ff0055; width: 100%; text-align: center;">Error de conexión con la API.</p>`;
        }
    }

    function renderMusicianCards(musicians) {
        cardsSection.innerHTML = '';

        if (!musicians || musicians.length === 0) {
            if (noResults) {
                noResults.classList.add('show');
                noResults.style.display = "block";
            }
            return;
        }

        if (noResults) {
            noResults.classList.remove('show');
            noResults.style.display = "none";
        }

        musicians.forEach(musician => {
            const cardHtml = createCardHTML(musician);
            cardsSection.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    function createCardHTML(musician) {
        const defaultImage = "/Imagenes/f2.jpg";
        const imageUrl = musician.fotoPerfilUrl && musician.fotoPerfilUrl.trim() !== ""
            ? musician.fotoPerfilUrl
            : defaultImage;

        const descData = parseDescripcion(musician.descripcion);
        const rating = musician.calificacionPromedio || 0;
        const totalReviews = musician.totalResenas || 0;
        const artistName = musician.nombreArtistico || `Músico #${musician.musicoId}`;

        const simulatedPrice = 3000;

        return `
            <div class="card" 
                 data-musico-id="${musician.musicoId}"
                 data-artist-name="${artistName}"
                 data-genres="${normalizeText(descData.genero)}" 
                 data-location="${musician.ubicacionPrincipalId}" 
                 data-price="${simulatedPrice}" 
                 data-rating="${rating}" 
                 data-description="${descData.biografia.substring(0, 150) + '...'}"
                 data-full-description="${descData.biografia}">
                
                <div class="card-image-container">
                    <img src="${imageUrl}" alt="${artistName}" class="card-image">
                    <span class="badge-disponible">Disponible</span>
                </div>
                
                <div class="card-body">
                    <h3 class="card-title">${artistName}</h3>
                    <p class="card-artist">${descData.experiencia}</p>
                    
                    <p class="card-description">${descData.biografia.substring(0, 60)}...</p>
                    
                    <div class="card-tags">
                        <span class="card-tag">${descData.genero}</span>
                    </div>
                    
                    <div class="card-rating">
                        ${renderStarsHtml(rating)}
                        <span class="rating-value">${rating.toFixed(1)}</span>
                        <span class="rating-count">(${totalReviews})</span>
                    </div>
                    
                    <div class="card-footer">
                        <div class="card-actions" style="margin-top: 10px;">
                            <a href="vistas/FormularioCot.html?id=${musician.musicoId}" class="btn-cotizar-link" style="width: 100%; display: block; text-align: center;">
                                Hacer cotización
                            </a> 
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- UTILITIES ---

    function renderStarsHtml(rating) {
        let stars = '';
        const fullStar = '<svg width="18" height="18" viewBox="0 0 22 18" fill="none"><path d="M11 12.925L5.438 16L6.5 9.488L2 4.875L8.2185 3.925L11 -2L13.7815 3.925L20 4.875L15.5 9.488L16.562 16L11 12.925Z" fill="#FFF200"/></svg>';
        const emptyStar = '<svg width="18" height="18" viewBox="0 0 22 18" fill="none"><path d="M11 12.925L5.438 16L6.5 9.488L2 4.875L8.2185 3.925L11 -2L13.7815 3.925L20 4.875L15.5 9.488L16.562 16L11 12.925Z" fill="#333" stroke="#FFF200" stroke-width="1"/></svg>';

        for (let i = 1; i <= 5; i++) {
            stars += (i <= Math.round(rating)) ? fullStar : emptyStar;
        }
        return stars;
    }

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

    // Inicializar
    loadGenres(); // <--- Cargar géneros dinámicos
    fetchMusicians();

    // --- EVENT LISTENERS Y LÓGICA DE FILTRADO ---

    // Función auxiliar para quitar acentos y normalizar texto
    function normalizeText(text) {
        if(!text) return "";
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    function applyFilters() {
        // 1. Obtener valores de los inputs
        var searchTerm = normalizeText(searchInput.value);
        var selectedGenres = [];
        
        // Obtener checkboxes marcados dinámicamente
        const dynamicCheckboxes = document.querySelectorAll('.genre-filter:checked');
        dynamicCheckboxes.forEach(function (checkbox) {
            // Guardamos el valor normalizado para comparar fácilmente (Ej: "norteño" -> "norteno")
            selectedGenres.push(normalizeText(checkbox.value));
        });

        var selectedLocation = locationFilter.value; 
        var minPrice = parseInt(minPriceInput.value) || 0;
        var maxPrice = parseInt(maxPriceInput.value) || 999999;
        var minRating = parseFloat(ratingFilter.value) || 0;

        // 2. Si no hay filtros activos, volvemos a mostrar solo los top 6
        const areFiltersActive = searchTerm !== '' || selectedGenres.length > 0 || selectedLocation !== '' || minPrice > 500 || maxPrice < 10000 || minRating > 0;
        
        if (!areFiltersActive) {
            renderMusicianCards(globalMusicians.slice(0, 6));
            return;
        }

        // 3. Filtrar el array globalMusicians
        const filteredMusicians = globalMusicians.filter(musician => {
            const artistName = normalizeText(musician.nombreArtistico || `Músico #${musician.musicoId}`);
            const descData = parseDescripcion(musician.descripcion);
            
            // Normalizar el género del músico también para la comparación
            const cardGenreNormalized = normalizeText(descData.genero);
            
            const cardLocation = String(musician.ubicacionPrincipalId);
            const cardPrice = 3000; 
            const cardRating = musician.calificacionPromedio || 0;

            // Coincidencia de búsqueda (Nombre O Género escrito)
            const matchesSearch = searchTerm === '' || artistName.includes(searchTerm) || cardGenreNormalized.includes(searchTerm);
            
            let matchesGenre = true;
            if (selectedGenres.length > 0) {
                // Verificar si el género normalizado del músico está en la lista de géneros seleccionados (también normalizados)
                // Usamos includes para ser flexibles (ej: "norteno banda" coincide con "norteno")
                matchesGenre = selectedGenres.some(g => cardGenreNormalized.includes(g));
            }

            const matchesLocation = selectedLocation === '' || cardLocation === selectedLocation;
            const matchesPrice = cardPrice >= minPrice && cardPrice <= maxPrice;
            const matchesRating = cardRating >= minRating;

            return matchesSearch && matchesGenre && matchesLocation && matchesPrice && matchesRating;
        });

        renderMusicianCards(filteredMusicians);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    // Los listeners de los checkboxes se agregan en loadGenres()
    if (locationFilter) locationFilter.addEventListener('change', applyFilters);
    if (ratingFilter) ratingFilter.addEventListener('change', applyFilters);
    if (minPriceInput) minPriceInput.addEventListener('input', applyFilters);
    if (maxPriceInput) maxPriceInput.addEventListener('input', applyFilters);

    // --- RESTO DE EVENT LISTENERS (Menu, Modales, etc.) ---
    
    function closeMusicianPrompt() {
        if (musicianPromptOverlay) musicianPromptOverlay.classList.remove('active');
    }

    function handleMusicianPrompt(e) {
        e.stopPropagation();
        const userData = getUserData();
        const userType = userData ? userData.tipoUsuarioId : null;

        if (userType === 1) {
            window.location.href = 'vistas/cliente_solicitudes.html';
            return;
        }

        if (userType === 2) {
            window.location.href = 'vistas/Notificaciones.html';
            return;
        }
        var answered = localStorage.getItem('musicianPromptAnswered');
        if (!answered || answered === 'no') {
            if (musicianPromptOverlay) musicianPromptOverlay.classList.add('active');
        } else if (answered === 'yes') {
            alert('¡Gracias por unirte! No tienes nuevas notificaciones.');
        } else {
            alert('No tienes nuevas notificaciones');
        }
    }

    function handleProfileClick(e) {
        e.stopPropagation();
        const userData = getUserData();
        if (!userData) {
            window.location.href = 'vistas/regitro.html';
            return;
        }
        if (userData.tipoUsuarioId === 2) {
            window.location.href = 'vistas/menuMusico.html';
        } else {
            if (modalOverlayCliente) {
                modalUserNameCliente.textContent = userData.nombreCompleto || 'Usuario';
                modalUserEmailCliente.textContent = userData.email || 'email@ejemplo.com';
                if (modalUserTypeCliente) modalUserTypeCliente.textContent = 'Cliente';

                modalOverlayCliente.classList.remove('hidden');
                modalOverlayCliente.classList.add('active');
                modalOverlayCliente.style.display = 'flex';
            }
        }
    }

    if (filterBtn && sidebar && overlay) {
        filterBtn.onclick = function () { sidebar.classList.add('active'); overlay.classList.add('active'); };
    }
    if (closeBtn && sidebar && overlay) {
        closeBtn.onclick = function () { sidebar.classList.remove('active'); overlay.classList.remove('active'); };
    }
    if (overlay && sidebar) {
        overlay.onclick = function () { sidebar.classList.remove('active'); overlay.classList.remove('active'); };
    }
    if (searchInput && searchBorder) {
        searchInput.onfocus = function () { searchBorder.style.boxShadow = '0 0 20px rgba(217, 70, 239, 0.5)'; };
        searchInput.onblur = function () { searchBorder.style.boxShadow = 'none'; };
    }

    if (btnModalBack && modalOverlay) {
        btnModalBack.onclick = function () { modalOverlay.classList.remove('active'); };
    }

    window.onclick = function (e) {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
        if (e.target === modalOverlayCliente) {
            modalOverlayCliente.classList.add('hidden');
            modalOverlayCliente.style.display = 'none';
        }
        if (e.target === musicianPromptOverlay) closeMusicianPrompt();
    };

    var userProfile = document.querySelector('.user-profile');
    if (userProfile) userProfile.onclick = handleProfileClick;

    if (bellIcon) bellIcon.onclick = handleMusicianPrompt;

    if (btnPromptNo) {
        btnPromptNo.onclick = function () {
            localStorage.setItem('musicianPromptAnswered', 'no');
            closeMusicianPrompt();
        };
    }

    if (promptCloseBtn) promptCloseBtn.onclick = closeMusicianPrompt;

    if (btnPromptYes) {
        btnPromptYes.onclick = function () {
            localStorage.setItem('musicianPromptAnswered', 'yes');
            window.location.href = 'vistas/menuMusico.html';
        };
    }

    if (modalCloseBtnCliente) {
        modalCloseBtnCliente.onclick = function () {
            modalOverlayCliente.classList.add('hidden');
            modalOverlayCliente.style.display = 'none';
        };
    }
});