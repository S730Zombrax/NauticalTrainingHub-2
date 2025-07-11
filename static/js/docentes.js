/**
 * Universidad Marítima del Caribe - Ingeniería Marítima
 * Sistema de Evaluación Docente con Códigos QR
 */

document.addEventListener('DOMContentLoaded', function() {
    initDocentesSystem();
});

/**
 * Inicializar el sistema de evaluación docente
 */
function initDocentesSystem() {
    generateQRCodes();
    initRatingSystem();
    initFormValidation();
    initCharacterCounters();
}

/**
 * Generar códigos QR para cada profesor
 */
function generateQRCodes() {
    const qrContainers = document.querySelectorAll('[id^="qr-"]');
    
    qrContainers.forEach((container, index) => {
        const professorId = container.id.split('-')[1];
        const professorCard = container.closest('.card');
        const professorName = professorCard.querySelector('.card-title').textContent;
        const evaluationUrl = `${window.location.origin}/evaluar-docente/${professorId}`;
        
        // Generar código QR con animación de carga
        setTimeout(() => {
            container.innerHTML = createQRCodeHTML(professorId, professorName, evaluationUrl);
            animateQRGeneration(container);
        }, 300 * (index + 1));
    });
}

/**
 * Crear HTML para el código QR
 * @param {string} professorId - ID del profesor
 * @param {string} professorName - Nombre del profesor
 * @param {string} url - URL de evaluación
 * @returns {string} HTML del código QR
 */
function createQRCodeHTML(professorId, professorName, url) {
    return `
        <div class="qr-visual-pattern" data-url="${url}">
            ${generateQRPattern(professorId)}
        </div>
        <p class="mt-2 mb-0 small text-muted">Código QR para ${professorName}</p>
        <p class="small text-primary fw-bold">ID: PROF-${professorId}</p>
        <div class="mt-2">
            <button class="btn btn-sm btn-outline-primary copy-url-btn" 
                    data-url="${url}" title="Copiar enlace">
                <i class="fas fa-copy me-1"></i>
                Copiar URL
            </button>
        </div>
    `;
}

/**
 * Generar patrón visual del código QR
 * @param {string} professorId - ID del profesor para generar patrón único
 * @returns {string} HTML del patrón QR
 */
function generateQRPattern(professorId) {
    const seed = parseInt(professorId) * 123; // Semilla para consistencia
    let pattern = '<div class="qr-pattern-grid">';
    
    for (let i = 0; i < 144; i++) {
        // Usar semilla para generar patrón consistente pero aparentemente aleatorio
        const randomValue = (seed * (i + 1) * 9301 + 49297) % 233280;
        const isBlack = (randomValue / 233280) > 0.45;
        pattern += `<div class="qr-pixel ${isBlack ? 'black' : 'white'}"></div>`;
    }
    
    pattern += '</div>';
    return pattern;
}

/**
 * Animar la generación del código QR
 * @param {HTMLElement} container - Contenedor del QR
 */
function animateQRGeneration(container) {
    const qrPattern = container.querySelector('.qr-pattern-grid');
    const pixels = qrPattern.querySelectorAll('.qr-pixel');
    
    // Animar píxeles uno por uno
    pixels.forEach((pixel, index) => {
        setTimeout(() => {
            pixel.style.opacity = '0';
            pixel.style.transform = 'scale(0)';
            
            setTimeout(() => {
                pixel.style.transition = 'all 0.2s ease';
                pixel.style.opacity = '1';
                pixel.style.transform = 'scale(1)';
            }, 50);
        }, index * 10);
    });
    
    // Agregar evento de copia después de la animación
    setTimeout(() => {
        initCopyButtons(container);
    }, pixels.length * 10 + 500);
}

/**
 * Inicializar botones de copiar URL
 * @param {HTMLElement} container - Contenedor del QR
 */
function initCopyButtons(container) {
    const copyBtn = container.querySelector('.copy-url-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            copyToClipboard(url);
            
            // Cambiar temporalmente el texto del botón
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check me-1"></i>¡Copiado!';
            this.classList.remove('btn-outline-primary');
            this.classList.add('btn-success');
            
            setTimeout(() => {
                this.innerHTML = originalText;
                this.classList.remove('btn-success');
                this.classList.add('btn-outline-primary');
            }, 2000);
        });
    }
}

/**
 * Copiar texto al portapapeles
 * @param {string} text - Texto a copiar
 */
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback para navegadores más antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
    }
}

/**
 * Inicializar sistema de calificación por estrellas
 */
function initRatingSystem() {
    const ratingGroups = document.querySelectorAll('.rating-group');
    
    ratingGroups.forEach(group => {
        const radioButtons = group.querySelectorAll('input[type="radio"]');
        
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                updateRatingVisual(group, this.value);
            });
        });
    });
}

/**
 * Actualizar visualización de calificaciones
 * @param {HTMLElement} group - Grupo de calificación
 * @param {string} value - Valor seleccionado
 */
function updateRatingVisual(group, value) {
    const labels = group.querySelectorAll('.form-check-label');
    const rating = parseInt(value);
    
    labels.forEach((label, index) => {
        const radioValue = parseInt(label.previousElementSibling.value);
        
        if (radioValue <= rating) {
            label.classList.add('selected-rating');
        } else {
            label.classList.remove('selected-rating');
        }
    });
    
    // Mostrar feedback visual
    showRatingFeedback(group, rating);
}

/**
 * Mostrar feedback visual de la calificación
 * @param {HTMLElement} group - Grupo de calificación
 * @param {number} rating - Calificación dada
 */
function showRatingFeedback(group, rating) {
    // Remover feedback anterior
    const existingFeedback = group.querySelector('.rating-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    let feedbackText = '';
    let feedbackClass = '';
    
    switch (rating) {
        case 5:
            feedbackText = '¡Excelente calificación!';
            feedbackClass = 'text-success';
            break;
        case 4:
            feedbackText = 'Muy buena calificación';
            feedbackClass = 'text-info';
            break;
        case 3:
            feedbackText = 'Calificación promedio';
            feedbackClass = 'text-secondary';
            break;
        case 2:
            feedbackText = 'Calificación baja';
            feedbackClass = 'text-warning';
            break;
        case 1:
            feedbackText = 'Calificación muy baja';
            feedbackClass = 'text-danger';
            break;
    }
    
    if (feedbackText) {
        const feedback = document.createElement('small');
        feedback.className = `rating-feedback ${feedbackClass} d-block mt-1`;
        feedback.textContent = feedbackText;
        group.appendChild(feedback);
    }
}

/**
 * Inicializar validación del formulario de evaluación
 */
function initFormValidation() {
    const evaluationForm = document.getElementById('evaluation-form');
    if (!evaluationForm) return;
    
    evaluationForm.addEventListener('submit', function(event) {
        if (!validateEvaluationForm(this)) {
            event.preventDefault();
            event.stopPropagation();
            showValidationErrors();
        } else {
            showSubmissionConfirmation();
        }
        
        this.classList.add('was-validated');
    });
    
    // Validación en tiempo real
    const inputs = evaluationForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

/**
 * Validar formulario de evaluación completo
 * @param {HTMLElement} form - Formulario a validar
 * @returns {boolean} - True si es válido
 */
function validateEvaluationForm(form) {
    let isValid = true;
    
    // Validar campos requeridos
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validar que al menos una calificación esté completa
    const ratingGroups = form.querySelectorAll('.rating-group');
    let hasRatings = false;
    
    ratingGroups.forEach(group => {
        const checkedRadio = group.querySelector('input[type="radio"]:checked');
        if (checkedRadio) {
            hasRatings = true;
        }
    });
    
    if (!hasRatings) {
        isValid = false;
        showNotification('Por favor, completa al menos una calificación', 'warning');
    }
    
    return isValid;
}

/**
 * Validar campo individual
 * @param {HTMLElement} field - Campo a validar
 * @returns {boolean} - True si es válido
 */
function validateField(field) {
    let isValid = true;
    const value = field.value.trim();
    
    // Limpiar estados anteriores
    field.classList.remove('is-invalid', 'is-valid');
    
    // Validación de campos requeridos
    if (field.hasAttribute('required') && value === '') {
        isValid = false;
        setFieldError(field, 'Este campo es obligatorio');
    }
    
    // Validación de cédula
    if (field.dataset.type === 'cedula' && value !== '') {
        const cedulaRegex = /^[VE]-\d{7,8}$/;
        if (!cedulaRegex.test(value)) {
            isValid = false;
            setFieldError(field, 'Formato inválido. Usa V-1234567 o E-1234567');
        }
    }
    
    // Validación de longitud máxima
    if (field.hasAttribute('maxlength') && value.length > parseInt(field.getAttribute('maxlength'))) {
        isValid = false;
        setFieldError(field, `Máximo ${field.getAttribute('maxlength')} caracteres`);
    }
    
    if (isValid && value !== '') {
        field.classList.add('is-valid');
    }
    
    return isValid;
}

/**
 * Establecer error en un campo
 * @param {HTMLElement} field - Campo con error
 * @param {string} message - Mensaje de error
 */
function setFieldError(field, message) {
    field.classList.add('is-invalid');
    
    let feedback = field.nextElementSibling;
    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentNode.insertBefore(feedback, field.nextSibling);
    }
    
    feedback.textContent = message;
}

/**
 * Mostrar errores de validación
 */
function showValidationErrors() {
    showNotification('Por favor, corrige los errores en el formulario', 'error');
    
    // Hacer scroll al primer error
    const firstError = document.querySelector('.is-invalid');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
    }
}

/**
 * Mostrar confirmación de envío
 */
function showSubmissionConfirmation() {
    showNotification('Evaluación enviada exitosamente. ¡Gracias por tu retroalimentación!', 'success');
}

/**
 * Inicializar contadores de caracteres
 */
function initCharacterCounters() {
    const textareas = document.querySelectorAll('textarea[maxlength]');
    
    textareas.forEach(textarea => {
        const maxLength = parseInt(textarea.getAttribute('maxlength'));
        
        // Crear contador si no existe
        let counter = textarea.nextElementSibling;
        if (!counter || !counter.classList.contains('form-text')) {
            counter = document.createElement('div');
            counter.className = 'form-text';
            textarea.parentNode.insertBefore(counter, textarea.nextSibling);
        }
        
        // Función para actualizar contador
        const updateCounter = () => {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = `${remaining} caracteres restantes`;
            
            // Cambiar color según caracteres restantes
            counter.classList.remove('text-warning', 'text-danger');
            if (remaining < 50) {
                counter.classList.add('text-warning');
            }
            if (remaining < 10) {
                counter.classList.remove('text-warning');
                counter.classList.add('text-danger');
            }
        };
        
        // Inicializar contador
        updateCounter();
        
        // Actualizar en tiempo real
        textarea.addEventListener('input', updateCounter);
    });
}

/**
 * Mostrar notificación
 * @param {string} message - Mensaje de la notificación
 * @param {string} type - Tipo de notificación (success, error, warning)
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show notification-toast`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Generar estadísticas de evaluación (para uso futuro)
 * @param {Object} evaluationData - Datos de la evaluación
 * @returns {Object} Estadísticas calculadas
 */
function calculateEvaluationStats(evaluationData) {
    const ratings = [
        evaluationData.dominio_materia,
        evaluationData.claridad_explicacion,
        evaluationData.puntualidad,
        evaluationData.disponibilidad,
        evaluationData.metodologia,
        evaluationData.evaluacion_general
    ].map(r => parseInt(r)).filter(r => !isNaN(r));
    
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    return {
        promedio: Math.round(average * 100) / 100,
        total_criterios: ratings.length,
        calificacion_maxima: Math.max(...ratings),
        calificacion_minima: Math.min(...ratings)
    };
}