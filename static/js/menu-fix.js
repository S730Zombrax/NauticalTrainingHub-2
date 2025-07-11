/**
 * Universidad Marítima del Caribe - Ingeniería Marítima
 * Corrección de Menú Móvil para Desplegables
 */

document.addEventListener('DOMContentLoaded', function() {
    // Solución para el problema de submenús en móviles
    const fixMobileMenuDropdowns = function() {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        
        // Agregar evento a cada toggle de menú desplegable
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                // Solo para vista móvil
                if (window.innerWidth <= 992) {
                    e.preventDefault();
                    e.stopPropagation(); // Detiene la propagación del evento
                    
                    // Alterna la clase 'show' en el toggle
                    this.classList.toggle('show');
                    
                    // Cerrar otros desplegables
                    dropdownToggles.forEach(otherToggle => {
                        if (otherToggle !== this) {
                            otherToggle.classList.remove('show');
                        }
                    });
                    
                    // Encontrar el menú desplegable y evitar que los clics dentro lo cierren
                    const dropdown = this.closest('.dropdown');
                    if (dropdown) {
                        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
                        if (dropdownMenu) {
                            // Prevenir que los clics en el menú desplegable se propaguen al documento
                            dropdownMenu.addEventListener('click', function(evt) {
                                evt.stopPropagation();
                            });
                        }
                    }
                }
            });
        });

        // Prevenir que los clics en los elementos del menú desplegable cierren el menú móvil
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                if (window.innerWidth <= 992) {
                    e.stopPropagation();
                }
            });
        });
    };

    // Inicializar la solución
    fixMobileMenuDropdowns();
});
