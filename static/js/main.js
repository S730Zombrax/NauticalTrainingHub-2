/**
 * Universidad Marítima del Caribe - Ingeniería Marítima
 * Archivo JavaScript principal
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar navegación
    initNavigation();
    
    // Inicializar efectos de desplazamiento
    initScrollEffects();
    
    // Inicializar animaciones
    initAnimations();
    
    // Inicializar componentes personalizados
    initComponents();
});

/**
 * Inicializar funcionalidad de navegación
 */
function initNavigation() {
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    // Alternar menú móvil
    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', function() {
            navbarToggle.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });
        
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(event) {
            if (!navbarMenu.contains(event.target) && !navbarToggle.contains(event.target)) {
                navbarMenu.classList.remove('active');
                navbarToggle.classList.remove('active');
            }
        });
    }
    
    // Funcionalidad desplegable para móvil
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            // Solo para vista móvil
            if (window.innerWidth <= 992) {
                e.preventDefault();
                e.stopPropagation(); // Detiene la propagación para evitar que el documento cierre el menú
                this.classList.toggle('show');
                
                // Encuentra el menú desplegable asociado a este toggle
                const dropdownMenu = this.nextElementSibling;
                if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
                    // Evitar que los clics en el menú desplegable cierren el menú principal
                    dropdownMenu.addEventListener('click', function(event) {
                        event.stopPropagation();
                    });
                }
                
                // Cerrar otros desplegables
                dropdownToggles.forEach(otherToggle => {
                    if (otherToggle !== this) {
                        otherToggle.classList.remove('show');
                    }
                });
            }
        });
    });
    
    // Cerrar desplegables cuando la ventana se redimensiona más allá del punto de quiebre móvil
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
            navbarMenu.classList.remove('active');
            navbarToggle.classList.remove('active');
            dropdownToggles.forEach(toggle => {
                toggle.classList.remove('show');
            });
        }
    });
    
    // Agregar clase activa al enlace de la página actual
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-item');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPage || 
            (currentPage === '/' && linkPath === '/index') || 
            (linkPath !== '/' && linkPath !== '#' && currentPage.includes(linkPath))) {
            
            link.classList.add('active');
            
            // Si el enlace activo está en un desplegable, agregar clase activa al toggle del desplegable padre
            if (link.classList.contains('dropdown-item')) {
                const parentDropdown = link.closest('.dropdown');
                if (parentDropdown) {
                    const dropdownToggle = parentDropdown.querySelector('.dropdown-toggle');
                    if (dropdownToggle) {
                        dropdownToggle.classList.add('active');
                    }
                }
            }
        }
    });
}

/**
 * Inicializar efectos de desplazamiento
 */
function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // Desplazamiento suave para enlaces de anclaje
    document.querySelectorAll('a[href^="#"]:not(.dropdown-toggle)').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                scrollToAnchor(targetId);
            }
        });
    });
}

/**
 * Inicializar animaciones
 */
function initAnimations() {
    // Agregar clases de animación cuando los elementos entran en el viewport
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const checkIfInView = () => {
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                const animation = element.getAttribute('data-animation') || 'fade-in';
                element.classList.add(animation);
            }
        });
    };
    
    // Verificar al desplazarse
    window.addEventListener('scroll', checkIfInView);
    // Verificar al cargar
    checkIfInView();
}

/**
 * Inicializar componentes personalizados
 */
function initComponents() {
    initTabs();
    initAccordion();
    initAlertDismissal();
    
    // Inicialización de tooltips
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            
            document.body.appendChild(tooltip);
            
            const triggerRect = this.getBoundingClientRect();
            tooltip.style.left = triggerRect.left + (triggerRect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = triggerRect.top - tooltip.offsetHeight - 10 + 'px';
            
            tooltip.classList.add('show');
            
            this.addEventListener('mouseleave', function() {
                tooltip.remove();
            }, { once: true });
        });
    });
}

/**
 * Inicializar componente de pestañas
 */
function initTabs() {
    const tabContainers = document.querySelectorAll('.tabs-container');
    
    tabContainers.forEach(container => {
        const tabLinks = container.querySelectorAll('.tab-link');
        const tabContents = container.querySelectorAll('.tab-content');
        
        tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Quitar clase activa de todas las pestañas
                tabLinks.forEach(link => link.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Agregar clase activa a la pestaña actual
                this.classList.add('active');
                
                const targetId = this.getAttribute('data-tab');
                const targetContent = container.querySelector(`#${targetId}`);
                
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
        
        // Activar primera pestaña por defecto
        if (tabLinks.length > 0 && tabContents.length > 0) {
            tabLinks[0].classList.add('active');
            tabContents[0].classList.add('active');
        }
    });
}

/**
 * Inicializar componente de acordeón
 */
function initAccordion() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        
        if (header && content) {
            header.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // Cerrar todos los elementos de acordeón
                if (!event.ctrlKey) {
                    document.querySelectorAll('.accordion-item').forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('active');
                            const otherContent = otherItem.querySelector('.accordion-content');
                            if (otherContent) {
                                otherContent.style.maxHeight = null;
                            }
                        }
                    });
                }
                
                // Alternar elemento actual
                item.classList.toggle('active');
                
                if (!isActive) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                } else {
                    content.style.maxHeight = null;
                }
            });
        }
    });
}

/**
 * Inicializar funcionalidad de descarte de alertas
 */
function initAlertDismissal() {
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(alert => {
        const closeBtn = alert.querySelector('.alert-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                alert.classList.add('fade-out');
                
                setTimeout(() => {
                    alert.remove();
                }, 300);
            });
        }
        
        // Cerrar automáticamente las alertas después de 5 segundos si tienen la clase auto-close
        if (alert.classList.contains('auto-close')) {
            setTimeout(() => {
                alert.classList.add('fade-out');
                
                setTimeout(() => {
                    alert.remove();
                }, 300);
            }, 5000);
        }
    });
}

/**
 * Función de utilidad para mostrar una notificación
 * @param {string} message - El mensaje de notificación
 * @param {string} type - El tipo de notificación (success, error, warning)
 * @param {number} duration - Duración en milisegundos
 */
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    
    switch(type) {
        case 'success':
            icon.innerHTML = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
            icon.innerHTML = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    
    notification.appendChild(icon);
    notification.appendChild(textSpan);
    
    // Agregar botón de cierre
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    notification.appendChild(closeBtn);
    
    // Agregar notificación al body
    document.body.appendChild(notification);
    
    // Mostrar notificación con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Ocultar notificación después de la duración
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

/**
 * Función de utilidad para desplazamiento suave a ancla
 * @param {string} target - Selector del elemento objetivo
 * @param {number} offset - Desplazamiento desde la parte superior en píxeles
 */
function scrollToAnchor(target, offset = 80) {
    const targetElement = document.querySelector(target);
    
    if (targetElement) {
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

/**
 * Inicializar las animaciones de elementos al hacer scroll
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar las animaciones al hacer scroll
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const checkIfInView = () => {
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('animated');
                const animation = element.getAttribute('data-animation') || 'fade-in';
                element.classList.add(animation);
            }
        });
    };
    
    // Verificar elementos al cargar la página
    checkIfInView();
    
    // Verificar elementos al hacer scroll
    window.addEventListener('scroll', checkIfInView);
});
