/**
 * Universidad Marítima del Caribe - Ingenieria maritima
 * Script de Validación de Formularios
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize validation for all forms
    const forms = document.querySelectorAll('.needs-validation');
    
    if (forms.length > 0) {
        initFormValidation(forms);
    }
    
    // Initialize specific form logic
    initRegistrationForm();
    initSuggestionForm();
});

/**
 * Initialize Bootstrap-style form validation
 * @param {NodeList} forms - Forms to initialize validation on
 */
function initFormValidation(forms) {
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!validateForm(form)) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
        
        // Real-time validation on input
        const inputs = form.querySelectorAll('input, textarea, select');
        Array.from(inputs).forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);
            });
            
            input.addEventListener('blur', () => {
                validateInput(input);
            });
        });
    });
}

/**
 * Validate a specific form input
 * @param {HTMLElement} input - The input element to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateInput(input) {
    let isValid = true;
    
    // Clear previous validation
    input.classList.remove('is-invalid');
    input.classList.remove('is-valid');
    
    // Required validation
    if (input.hasAttribute('required') && input.value.trim() === '') {
        isValid = false;
        setInvalidFeedback(input, 'Este campo es obligatorio');
    }
    
    // Email validation
    if (input.type === 'email' && input.value.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
            isValid = false;
            setInvalidFeedback(input, 'Por favor, introduce un correo electrónico válido');
        }
    }
    
    // Phone number validation
    if (input.type === 'tel' && input.value.trim() !== '') {
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(input.value.replace(/\D/g, ''))) {
            isValid = false;
            setInvalidFeedback(input, 'Por favor, introduce un número telefónico válido');
        }
    }
    
    // ID validation (Cédula)
    if (input.dataset.type === 'cedula' && input.value.trim() !== '') {
        const cedulaRegex = /^[VE]-\d{7,8}$/;
        if (!cedulaRegex.test(input.value)) {
            isValid = false;
            setInvalidFeedback(input, 'Formato inválido. Usa V-1234567 o E-1234567');
        }
    }
    
    // Minimum length validation
    if (input.hasAttribute('minlength') && input.value.trim() !== '') {
        const minLength = parseInt(input.getAttribute('minlength'));
        if (input.value.length < minLength) {
            isValid = false;
            setInvalidFeedback(input, `Este campo debe tener al menos ${minLength} caracteres`);
        }
    }
    
    // Maximum length validation
    if (input.hasAttribute('maxlength') && input.value.trim() !== '') {
        const maxLength = parseInt(input.getAttribute('maxlength'));
        if (input.value.length > maxLength) {
            isValid = false;
            setInvalidFeedback(input, `Este campo no puede exceder los ${maxLength} caracteres`);
        }
    }
    
    // Pattern validation
    if (input.hasAttribute('pattern') && input.value.trim() !== '') {
        const pattern = new RegExp(input.getAttribute('pattern'));
        if (!pattern.test(input.value)) {
            isValid = false;
            setInvalidFeedback(input, input.dataset.errorPattern || 'Por favor, sigue el formato requerido');
        }
    }
    
    // Custom validations based on input name
    if (input.name === 'mensaje' || input.name === 'sugerencia') {
        // Filter for inappropriate language (simplified example)
        const inappropriateWords = ['maldito', 'idiota', 'estupido', 'tonto', 'pendejo'];
        const hasBadWord = inappropriateWords.some(word => 
            input.value.toLowerCase().includes(word)
        );
        
        if (hasBadWord) {
            isValid = false;
            setInvalidFeedback(input, 'Por favor, mantén un lenguaje apropiado y respetuoso');
        }
    }
    
    // Set appropriate class based on validation result
    if (input.value.trim() !== '') {
        input.classList.add(isValid ? 'is-valid' : 'is-invalid');
    }
    
    return isValid;
}

/**
 * Set invalid feedback message for an input
 * @param {HTMLElement} input - The input element
 * @param {string} message - The error message
 */
function setInvalidFeedback(input, message) {
    // Find or create feedback element
    let feedback = input.nextElementSibling;
    
    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        input.parentNode.insertBefore(feedback, input.nextSibling);
    }
    
    feedback.textContent = message;
}

/**
 * Validate an entire form
 * @param {HTMLElement} form - The form to validate
 * @returns {boolean} - True if form is valid, false otherwise
 */
function validateForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    Array.from(inputs).forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Initialize registration form specific logic
 */
function initRegistrationForm() {
    const registrationForm = document.getElementById('registration-form');
    if (!registrationForm) return;
    
    // Generate QR code preview if available
    const qrPreview = document.getElementById('qr-preview');
    const studentIDInput = document.getElementById('student-id');
    
    if (qrPreview && studentIDInput) {
        studentIDInput.addEventListener('input', () => {
            if (studentIDInput.value.trim() !== '' && validateInput(studentIDInput)) {
                // Create QR code placeholder (in a real app, this would generate an actual QR code)
                qrPreview.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-qrcode fa-5x text-primary"></i>
                        <p class="mt-2">QR para: ${studentIDInput.value}</p>
                        <p class="text-muted small">Este código QR dará acceso a tu información académica.</p>
                    </div>
                `;
            } else {
                qrPreview.innerHTML = `
                    <div class="text-center p-4 text-muted">
                        <i class="fas fa-qrcode fa-3x text-secondary"></i>
                        <p class="mt-2">Ingresa tu ID para generar el código QR</p>
                    </div>
                `;
            }
        });
    }
    
    // Special handling for profile photo upload
    const photoUpload = document.getElementById('profile-photo');
    const photoPreview = document.getElementById('photo-preview');
    
    if (photoUpload && photoPreview) {
        photoUpload.addEventListener('change', () => {
            // In a real app, this would handle file upload
            // For now, just show a placeholder
            photoPreview.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-user-circle fa-5x text-primary"></i>
                    <p class="mt-2">Foto seleccionada</p>
                </div>
            `;
        });
    }
}

/**
 * Initialize suggestion form specific logic
 */
function initSuggestionForm() {
    const suggestionForm = document.getElementById('suggestion-form');
    if (!suggestionForm) return;
    
    const messageInput = suggestionForm.querySelector('textarea[name="mensaje"]');
    const charCounter = document.getElementById('char-counter');
    
    if (messageInput && charCounter) {
        const maxLength = parseInt(messageInput.getAttribute('maxlength')) || 500;
        
        messageInput.addEventListener('input', () => {
            const remaining = maxLength - messageInput.value.length;
            charCounter.textContent = `${remaining} caracteres restantes`;
            
            if (remaining < 50) {
                charCounter.classList.add('text-warning');
            } else {
                charCounter.classList.remove('text-warning');
            }
            
            if (remaining < 10) {
                charCounter.classList.add('text-danger');
            } else {
                charCounter.classList.remove('text-danger');
            }
        });
    }
    
    // Filter bad words in real-time
    if (messageInput) {
        messageInput.addEventListener('input', () => {
            const text = messageInput.value;
            const inappropriateWords = ['maldito', 'idiota', 'estupido', 'tonto', 'pendejo'];
            
            let filteredText = text;
            inappropriateWords.forEach(word => {
                const regex = new RegExp(word, 'gi');
                filteredText = filteredText.replace(regex, '*'.repeat(word.length));
            });
            
            if (filteredText !== text) {
                messageInput.value = filteredText;
                
                // Show warning
                if (!document.getElementById('language-warning')) {
                    const warning = document.createElement('div');
                    warning.id = 'language-warning';
                    warning.className = 'alert alert-warning mt-2';
                    warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Por favor, mantén un lenguaje apropiado y respetuoso.';
                    messageInput.parentNode.appendChild(warning);
                    
                    // Auto-remove warning after 5 seconds
                    setTimeout(() => {
                        const warningElement = document.getElementById('language-warning');
                        if (warningElement) {
                            warningElement.remove();
                        }
                    }, 5000);
                }
            }
        });
    }
}
