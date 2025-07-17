/**
 * Maritime Phraseology AI Chatbot
 * Universidad Marítima del Caribe - Ingeniería Marítima
 */

document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const quickButtons = document.querySelectorAll('.quick-btn');

    if (!chatContainer || !messageInput || !sendButton) {
        return; // Only initialize if we're on the idiomas page
    }

    // Initialize chatbot
    initMaritimeChatbot();

    function initMaritimeChatbot() {
        // Send button click event
        sendButton.addEventListener('click', sendMessage);
        
        // Enter key press event
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Quick button events
        quickButtons.forEach(button => {
            button.addEventListener('click', function() {
                const message = this.getAttribute('data-message');
                sendMessage(message);
            });
        });

        // Show welcome message
        showWelcomeMessage();
    }

    function showWelcomeMessage() {
        const welcomeHtml = `
            <div class="message-container mb-3">
                <div class="message bot-message">
                    <div class="message-header">
                        <i class="fas fa-robot text-primary me-2"></i>
                        <strong>Asistente Marítimo</strong>
                        <small class="text-muted ms-auto">${getCurrentTime()}</small>
                    </div>
                    <div class="message-content">
                        ¡Bienvenido! Soy tu asistente especializado en fraseología marítima. 
                        Puedo ayudarte con traducciones de términos náuticos, vocabulario marítimo básico, 
                        y comunicación en diferentes idiomas para la marina mercante.
                        <br><br>
                        <strong>¿En qué puedo ayudarte hoy?</strong>
                    </div>
                </div>
            </div>
        `;
        
        // Clear the welcome text and add the message
        chatContainer.innerHTML = welcomeHtml;
    }

    function sendMessage(customMessage = null) {
        const message = customMessage || messageInput.value.trim();
        
        if (!message) {
            showNotification('Por favor escribe un mensaje', 'warning');
            return;
        }

        // Clear input if using custom message
        if (!customMessage) {
            messageInput.value = '';
        }

        // Show user message
        addMessageToChat(message, 'user');
        
        // Show typing indicator
        showTypingIndicator();
        
        // Send to API
        callMaritimeAPI(message);
    }

    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-container mb-3';
        
        const isBot = sender === 'bot';
        const messageClass = isBot ? 'bot-message' : 'user-message';
        const icon = isBot ? 'fas fa-robot text-primary' : 'fas fa-user text-white';
        const senderName = isBot ? 'Asistente Marítimo' : 'Tú';
        
        messageElement.innerHTML = `
            <div class="message ${messageClass}">
                <div class="message-header">
                    <i class="${icon} me-2"></i>
                    <strong>${senderName}</strong>
                    <small class="text-muted ms-auto">${getCurrentTime()}</small>
                </div>
                <div class="message-content">
                    ${formatMessage(message)}
                </div>
            </div>
        `;

        chatContainer.appendChild(messageElement);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.id = 'typing-indicator';
        typingElement.className = 'message-container mb-3';
        typingElement.innerHTML = `
            <div class="message bot-message">
                <div class="message-header">
                    <i class="fas fa-robot text-primary me-2"></i>
                    <strong>Asistente Marítimo</strong>
                </div>
                <div class="message-content">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <small class="text-muted">Escribiendo...</small>
                </div>
            </div>
        `;

        chatContainer.appendChild(typingElement);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async function callMaritimeAPI(message) {
        try {
            const response = await fetch('/api/maritime-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            removeTypingIndicator();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                addMessageToChat(`Error: ${data.error}`, 'bot');
            } else {
                addMessageToChat(data.response || 'Respuesta vacía recibida', 'bot');
            }

        } catch (error) {
            removeTypingIndicator();
            console.error('Error calling maritime API:', error);
            addMessageToChat(
                'Lo siento, hubo un problema conectando con el asistente. Por favor, intenta de nuevo en unos momentos.',
                'bot'
            );
        }
    }

    function formatMessage(message) {
        // Ensure message is a string
        if (typeof message !== 'string') {
            message = String(message);
        }
        
        // Convert line breaks to HTML
        message = message.replace(/\n/g, '<br>');
        
        // Make certain words bold
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Create simple tables for vocabulary lists
        if (message.includes('|') && message.includes('---')) {
            message = convertTableToHTML(message);
        }
        
        return message;
    }

    function convertTableToHTML(text) {
        const lines = text.split('\n');
        let tableHTML = '<div class="table-responsive mt-3"><table class="table table-sm table-bordered">';
        let inTable = false;
        
        for (const line of lines) {
            if (line.includes('|')) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                
                if (line.includes('---')) {
                    continue; // Skip separator lines
                }
                
                if (!inTable) {
                    tableHTML += '<thead class="table-light"><tr>';
                    cells.forEach(cell => {
                        tableHTML += `<th>${cell}</th>`;
                    });
                    tableHTML += '</tr></thead><tbody>';
                    inTable = true;
                } else {
                    tableHTML += '<tr>';
                    cells.forEach(cell => {
                        tableHTML += `<td>${cell}</td>`;
                    });
                    tableHTML += '</tr>';
                }
            }
        }
        
        if (inTable) {
            tableHTML += '</tbody></table></div>';
            return text.replace(/\|.*\n?/g, '') + tableHTML;
        }
        
        return text;
    }

    function getCurrentTime() {
        return new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showNotification(message, type = 'info') {
        // Simple notification function
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
});

// CSS styles for messages (added dynamically)
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .message {
            border-radius: 12px;
            padding: 12px 16px;
            margin: 8px 0;
            max-width: 85%;
        }
        
        .user-message {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            margin-left: auto;
            margin-right: 0;
        }
        
        .bot-message {
            background: white;
            border: 1px solid #dee2e6;
            margin-right: auto;
            margin-left: 0;
        }
        
        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        
        .message-content {
            line-height: 1.5;
        }
        
        .typing-dots {
            display: inline-flex;
            gap: 4px;
            margin-right: 8px;
        }
        
        .typing-dots span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #007bff;
            animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0s; }
        
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
        
        .quick-btn:hover {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        }
    `;
    document.head.appendChild(style);
});