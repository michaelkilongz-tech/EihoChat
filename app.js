// DeepSeek AI Chat - Working Version
console.log("✅ DeepSeek App Loading...");

class DeepSeekApp {
    constructor() {
        console.log("✅ App Constructor Running");
        this.config = {
            backendUrl: 'https://eiho-chat.vercel.app/api/chat',
        };
        
        this.init();
    }
    
    init() {
        console.log("✅ Initializing app...");
        this.cacheElements();
        this.bindEvents();
        this.showLogin();
    }
    
    cacheElements() {
        console.log("✅ Caching elements...");
        this.elements = {
            loginScreen: document.getElementById('loginScreen'),
            appScreen: document.getElementById('appScreen'),
            guestBtn: document.getElementById('guestBtn'),
            loginBtn: document.getElementById('loginBtn'),
            loginEmail: document.getElementById('loginEmail'),
            loginPassword: document.getElementById('loginPassword'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            chatContainer: document.getElementById('chatContainer'),
            logoutBtn: document.getElementById('logoutBtn'),
            newChatBtn: document.getElementById('newChatBtn')
        };
        
        console.log("Elements found:", this.elements);
    }
    
    bindEvents() {
        console.log("✅ Binding events...");
        
        // Guest Login
        if (this.elements.guestBtn) {
            this.elements.guestBtn.addEventListener('click', () => {
                console.log("Guest login clicked");
                this.handleGuestLogin();
            });
        }
        
        // Regular Login
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Login clicked");
                this.handleLogin();
            });
        }
        
        // Send Message
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => {
                console.log("Send clicked");
                this.sendMessage();
            });
        }
        
        // Logout
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                console.log("Logout clicked");
                this.handleLogout();
            });
        }
        
        // New Chat
        if (this.elements.newChatBtn) {
            this.elements.newChatBtn.addEventListener('click', () => {
                console.log("New chat clicked");
                this.createNewChat();
            });
        }
        
        // Enter key in message input
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        console.log("✅ Events bound!");
    }
    
    handleGuestLogin() {
        console.log("✅ Guest login");
        this.elements.loginScreen.classList.add('hidden');
        this.elements.appScreen.classList.remove('hidden');
        this.createNewChat();
    }
    
    handleLogin() {
        const email = this.elements.loginEmail.value;
        const password = this.elements.loginPassword.value;
        
        if (!email || !password) {
            alert("Please enter email and password");
            return;
        }
        
        console.log("Login attempt with:", email);
        this.elements.loginScreen.classList.add('hidden');
        this.elements.appScreen.classList.remove('hidden');
        this.createNewChat();
    }
    
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message) return;
        
        console.log("Sending message:", message);
        
        // Clear input
        this.elements.messageInput.value = '';
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Show typing
        const typingId = this.showTyping();
        
        try {
            console.log("Calling backend...");
            const response = await fetch(this.config.backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            
            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);
            
            // Remove typing
            this.hideTyping(typingId);
            
            if (data.success) {
                this.addMessage(data.response, 'ai');
            } else {
                this.addMessage("Error: " + (data.error || "Unknown error"), 'ai');
            }
            
        } catch (error) {
            console.error("Chat error:", error);
            this.hideTyping(typingId);
            this.addMessage("Connection error. Please try again.", 'ai');
        }
    }
    
    addMessage(content, role) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const avatarIcon = role === 'user' ? 'fas fa-user' : 'fas fa-robot';
        const senderName = role === 'user' ? 'You' : 'DeepSeek AI';
        
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender">${senderName}</span>
                </div>
                <div class="message-text">
                    <p>${content}</p>
                </div>
            </div>
        `;
        
        this.elements.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTyping() {
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'message ai-message';
        typingDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <p><i>AI is typing...</i></p>
                </div>
            </div>
        `;
        
        this.elements.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
        return typingId;
    }
    
    hideTyping(typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    }
    
    createNewChat() {
        this.elements.chatContainer.innerHTML = `
            <div class="message ai-message">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">
                        <p>Hello! I'm DeepSeek AI. How can I help you today?</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    handleLogout() {
        if (confirm("Logout?")) {
            this.elements.appScreen.classList.add('hidden');
            this.elements.loginScreen.classList.remove('hidden');
            this.elements.loginEmail.value = '';
            this.elements.loginPassword.value = '';
        }
    }
    
    showLogin() {
        this.elements.appScreen.classList.add('hidden');
        this.elements.loginScreen.classList.remove('hidden');
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
        }, 100);
    }
}

// Initialize when page loads
console.log("✅ Starting app...");
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM Loaded!");
    window.app = new DeepSeekApp();
});