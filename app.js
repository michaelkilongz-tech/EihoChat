// SIMPLE WORKING VERSION - Guest Only
console.log("🚀 DeepSeek AI Loading...");

class ChatApp {
    constructor() {
        this.backendUrl = 'https://eiho-chat.vercel.app/api/chat';
        this.init();
    }
    
    init() {
        console.log("✅ App initialized");
        this.setupEventListeners();
        this.showChat(); // Auto-show chat (no login)
    }
    
    setupEventListeners() {
        // Send button
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // Message input enter key
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize textarea
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
        
        // New Chat button
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.newChat());
        }
        
        // Sidebar toggle
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Logout button (just refreshes page)
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Start new session?')) {
                    location.reload();
                }
            });
        }
        
        console.log("✅ All events set up");
    }
    
    showChat() {
        // Hide login screen, show app
        const loginScreen = document.getElementById('loginScreen');
        const appScreen = document.getElementById('appScreen');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (appScreen) appScreen.style.display = 'block';
        
        // Add welcome message
        this.addMessage('Hello! I\'m DeepSeek AI. How can I help you today?', 'ai');
    }
    
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        console.log("📤 Sending:", message);
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        input.style.height = 'auto';
        
        // Show typing indicator
        const typingId = this.showTypingIndicator();
        
        try {
            const response = await fetch(this.backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: message,
                    model: 'llama-3.1-8b-instant'
                })
            });
            
            const data = await response.json();
            
            // Remove typing
            this.removeTypingIndicator(typingId);
            
            if (data.success) {
                this.addMessage(data.response, 'ai');
            } else {
                this.addMessage('Error: ' + (data.error || 'Service unavailable'), 'ai');
            }
            
        } catch (error) {
            console.error("Chat error:", error);
            this.removeTypingIndicator(typingId);
            this.addMessage('Connection error. Please try again.', 'ai');
        }
    }
    
    addMessage(content, role) {
        const container = document.getElementById('chatContainer');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const avatar = role === 'user' ? 'fas fa-user' : 'fas fa-robot';
        const sender = role === 'user' ? 'You' : 'DeepSeek AI';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Format message (simple markdown)
        let formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
        
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="${avatar}"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender">${sender}</span>
                    <span class="time">${time}</span>
                </div>
                <div class="message-text">
                    <p>${formattedContent}</p>
                </div>
                <div class="message-actions">
                    <button class="action-btn copy-btn" onclick="navigator.clipboard.writeText('${content.replace(/'/g, "\\'")}')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const container = document.getElementById('chatContainer');
        if (!container) return null;
        
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'message ai-message';
        
        typingDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p>AI is thinking...</p>
                </div>
            </div>
        `;
        
        container.appendChild(typingDiv);
        this.scrollToBottom();
        return typingId;
    }
    
    removeTypingIndicator(id) {
        if (!id) return;
        const element = document.getElementById(id);
        if (element) element.remove();
    }
    
    newChat() {
        if (confirm('Start a new chat? Current chat will be cleared.')) {
            const container = document.getElementById('chatContainer');
            if (container) {
                container.innerHTML = '';
                this.addMessage('Hello! I\'m DeepSeek AI. How can I help you today?', 'ai');
            }
        }
    }
    
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    }
    
    scrollToBottom() {
        const container = document.getElementById('chatContainer');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }
}

// Start app when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Page loaded, starting chat app...");
    window.chatApp = new ChatApp();
});