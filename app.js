class DeepSeekApp {
    constructor() {
        // Configuration
        this.config = {
            backendUrl: 'https://eiho-chat.vercel.app/api/chat', // ← YOUR BACKEND URL HERE
            defaultModel: 'llama-3.1-8b-instant',
            maxTokens: 1024,
            temperature: 0.7,
            maxHistory: 10
        };
        
        // State
        this.state = {
            currentUser: null,
            currentChat: null,
            chats: [],
            conversations: {},
            isTyping: false,
            isOnline: true,
            theme: 'light'
        };
        
        // DOM Elements
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    // ===== INITIALIZATION =====
    async init() {
        this.cacheElements();
        this.bindEvents();
        this.loadState();
        this.setupMarked();
        this.checkAuth();
        this.hideLoading();
    }
    
    cacheElements() {
        // Screens
        this.elements.loadingScreen = document.getElementById('loadingScreen');
        this.elements.loginScreen = document.getElementById('loginScreen');
        this.elements.appScreen = document.getElementById('appScreen');
        
        // Login Elements
        this.elements.loginEmail = document.getElementById('loginEmail');
        this.elements.loginPassword = document.getElementById('loginPassword');
        this.elements.loginForm = document.getElementById('loginForm');
        this.elements.registerForm = document.getElementById('registerForm');
        this.elements.registerName = document.getElementById('registerName');
        this.elements.registerEmail = document.getElementById('registerEmail');
        this.elements.registerPassword = document.getElementById('registerPassword');
        this.elements.confirmPassword = document.getElementById('confirmPassword');
        this.elements.loginBtn = document.querySelector('#loginForm .btn-primary');
        this.elements.registerBtn = document.querySelector('#registerForm .btn-primary');
        this.elements.guestBtn = document.getElementById('guestBtn');
        this.elements.tabBtns = document.querySelectorAll('.tab-btn');
        
        // App Elements
        this.elements.sidebar = document.querySelector('.sidebar');
        this.elements.menuToggle = document.getElementById('menuToggle');
        this.elements.sidebarToggle = document.getElementById('sidebarToggle');
        this.elements.newChatBtn = document.getElementById('newChatBtn');
        this.elements.chatList = document.getElementById('chatList');
        this.elements.chatContainer = document.getElementById('chatContainer');
        this.elements.messageInput = document.getElementById('messageInput');
        this.elements.sendBtn = document.getElementById('sendBtn');
        this.elements.modelSelect = document.getElementById('modelSelect');
        this.elements.userName = document.getElementById('userName');
        this.elements.userEmail = document.getElementById('userEmail');
        this.elements.currentChatTitle = document.getElementById('currentChatTitle');
        this.elements.currentModel = document.getElementById('currentModel');
        this.elements.responseTime = document.getElementById('responseTime');
        this.elements.tokenCount = document.getElementById('tokenCount');
        this.elements.typingIndicator = document.getElementById('typingIndicator');
        
        // Buttons
        this.elements.logoutBtn = document.getElementById('logoutBtn');
        this.elements.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.elements.clearChatBtn = document.getElementById('clearChatBtn');
        this.elements.saveChatBtn = document.getElementById('saveChatBtn');
        this.elements.shareChatBtn = document.getElementById('shareChatBtn');
        
        // Modals
        this.elements.settingsModal = document.getElementById('settingsModal');
        this.elements.aboutModal = document.getElementById('aboutModal');
        this.elements.feedbackModal = document.getElementById('feedbackModal');
        this.elements.termsModal = document.getElementById('termsModal');
        this.elements.privacyModal = document.getElementById('privacyModal');
        
        // Toast
        this.elements.toast = document.getElementById('toast');
    }
    
    bindEvents() {
        // Login Events
        this.elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        this.elements.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        this.elements.guestBtn.addEventListener('click', () => this.handleGuestLogin());
        
        // Tab Switching
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Chat Events
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('input', () => this.handleInputChange());
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.elements.newChatBtn.addEventListener('click', () => this.createNewChat());
        this.elements.modelSelect.addEventListener('change', (e) => {
            this.elements.currentModel.textContent = e.target.selectedOptions[0].text;
        });
        
        // Sidebar Events
        this.elements.menuToggle.addEventListener('click', () => this.toggleSidebar());
        this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearAllChats());
        this.elements.clearChatBtn.addEventListener('click', () => this.clearCurrentChat());
        this.elements.saveChatBtn.addEventListener('click', () => this.exportChat());
        this.elements.shareChatBtn.addEventListener('click', () => this.shareChat());
        
        // Modal Triggers
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => this.handleAction(btn.dataset.action));
        });
        
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(link.dataset.page);
            });
        });
        
        // Password visibility toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
        
        // Theme toggle
        document.addEventListener('DOMContentLoaded', () => {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.setTheme('dark');
            }
        });
    }
    
    // ===== AUTHENTICATION =====
    async handleLogin() {
        const email = this.elements.loginEmail.value.trim();
        const password = this.elements.loginPassword.value;
        
        if (!this.validateEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        this.elements.loginBtn.disabled = true;
        this.elements.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        
        try {
            // In a real app, this would call your backend
            const user = this.mockAuth(email, password);
            
            if (user) {
                this.state.currentUser = user;
                this.saveState();
                this.showApp();
                this.showToast('Login successful!');
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            this.showToast(error.message || 'Login failed', 'error');
        } finally {
            this.elements.loginBtn.disabled = false;
            this.elements.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }
    
    async handleRegister() {
        const name = this.elements.registerName.value.trim();
        const email = this.elements.registerEmail.value.trim();
        const password = this.elements.registerPassword.value;
        const confirmPassword = this.elements.confirmPassword.value;
        
        if (!name) {
            this.showToast('Please enter your name', 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }
        
        this.elements.registerBtn.disabled = true;
        this.elements.registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        
        try {
            // Mock registration - in real app, call backend
            const user = {
                id: this.generateId(),
                name: name,
                email: email,
                createdAt: new Date().toISOString(),
                isGuest: false
            };
            
            this.state.currentUser = user;
            this.saveState();
            this.showApp();
            this.showToast('Account created successfully!');
        } catch (error) {
            this.showToast('Registration failed', 'error');
        } finally {
            this.elements.registerBtn.disabled = false;
            this.elements.registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    }
    
    handleGuestLogin() {
        this.state.currentUser = {
            id: 'guest_' + this.generateId(),
            name: 'Guest User',
            email: 'guest@example.com',
            createdAt: new Date().toISOString(),
            isGuest: true
        };
        
        this.saveState();
        this.showApp();
        this.showToast('Welcome as guest! Some features are limited.');
    }
    
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.state.currentUser = null;
            this.state.currentChat = null;
            this.saveState();
            this.showLogin();
            this.showToast('Logged out successfully');
        }
    }
    
    checkAuth() {
        if (this.state.currentUser) {
            this.showApp();
        } else {
            this.showLogin();
        }
    }
    
    // ===== CHAT FUNCTIONALITY =====
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.state.isTyping) return;
        
        // Clear input
        this.elements.messageInput.value = '';
        this.elements.sendBtn.disabled = true;
        this.handleInputChange();
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        this.state.isTyping = true;
        
        // Start timing
        const startTime = Date.now();
        
        try {
            // Prepare conversation history
            const currentConversation = this.state.conversations[this.state.currentChat] || [];
            const conversationHistory = currentConversation.slice(-this.config.maxHistory);
            
            // Call OUR backend
            const response = await fetch(this.config.backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    model: this.elements.modelSelect.value,
                    conversation: conversationHistory.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                })
            });
            
            const data = await response.json();
            
            // Calculate response time
            const responseTime = Date.now() - startTime;
            this.elements.responseTime.textContent = `${(responseTime / 1000).toFixed(1)}s`;
            
            if (data.success) {
                // Add AI response
                this.addMessage(data.response, 'ai');
                
                // Update conversation history
                this.updateConversation([
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.response }
                ]);
                
                // Update token count if available
                if (data.usage) {
                    this.elements.tokenCount.textContent = data.usage.total_tokens || '0';
                }
                
                // Update chat title if it's the first message
                if (currentConversation.length === 0) {
                    this.updateChatTitle(message.substring(0, 50));
                }
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage(`Sorry, I encountered an error: ${error.message}`, 'ai');
        } finally {
            this.hideTypingIndicator();
            this.state.isTyping = false;
        }
    }
    
    addMessage(content, role) {
        const messageId = this.generateId();
        const timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.dataset.id = messageId;
        
        const avatarIcon = role === 'user' ? 'fas fa-user' : 'fas fa-robot';
        const senderName = role === 'user' ? 'You' : 'DeepSeek AI';
        
        // Parse markdown for AI messages
        const messageContent = role === 'ai' ? marked.parse(content) : content;
        
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender">${senderName}</span>
                    <span class="time">${timestamp}</span>
                </div>
                <div class="message-body">${messageContent}</div>
                <div class="message-actions">
                    <button class="action-btn" data-action="copy" data-message="${content}">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="action-btn" data-action="like" data-message-id="${messageId}">
                        <i class="fas fa-thumbs-up"></i> Like
                    </button>
                </div>
            </div>
        `;
        
        this.elements.chatContainer.appendChild(messageDiv);
        
        // Add event listeners for action buttons
        messageDiv.querySelector('[data-action="copy"]').addEventListener('click', (e) => {
            this.copyToClipboard(e.target.dataset.message);
        });
        
        messageDiv.querySelector('[data-action="like"]').addEventListener('click', (e) => {
            this.likeMessage(e.target.dataset.messageId);
        });
        
        // Highlight code blocks
        if (role === 'ai') {
            setTimeout(() => {
                messageDiv.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }, 100);
        }
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    createNewChat() {
        const chatId = this.generateId();
        const chat = {
            id: chatId,
            title: 'New Chat',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0
        };
        
        this.state.chats.unshift(chat);
        this.state.currentChat = chatId;
        this.state.conversations[chatId] = [];
        
        this.saveState();
        this.loadChat(chatId);
        this.showToast('New chat created');
    }
    
    loadChat(chatId) {
        this.state.currentChat = chatId;
        const chat = this.state.chats.find(c => c.id === chatId);
        
        if (chat) {
            this.elements.currentChatTitle.textContent = chat.title;
            this.elements.chatContainer.innerHTML = '';
            
            // Load conversation messages
            const conversation = this.state.conversations[chatId] || [];
            conversation.forEach(msg => {
                this.addMessage(msg.content, msg.role);
            });
            
            // Update chat list active state
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.toggle('active', item.dataset.chatId === chatId);
            });
            
            this.scrollToBottom();
        }
    }
    
    updateChatTitle(newTitle) {
        const chatIndex = this.state.chats.findIndex(c => c.id === this.state.currentChat);
        if (chatIndex > -1) {
            this.state.chats[chatIndex].title = newTitle;
            this.state.chats[chatIndex].updatedAt = new Date().toISOString();
            this.elements.currentChatTitle.textContent = newTitle;
            this.saveState();
            this.renderChatList();
        }
    }
    
    updateConversation(messages) {
        if (!this.state.currentChat) return;
        
        if (!this.state.conversations[this.state.currentChat]) {
            this.state.conversations[this.state.currentChat] = [];
        }
        
        this.state.conversations[this.state.currentChat].push(...messages);
        
        // Update chat metadata
        const chatIndex = this.state.chats.findIndex(c => c.id === this.state.currentChat);
        if (chatIndex > -1) {
            this.state.chats[chatIndex].updatedAt = new Date().toISOString();
            this.state.chats[chatIndex].messageCount = this.state.conversations[this.state.currentChat].length;
        }
        
        this.saveState();
    }
    
    clearCurrentChat() {
        if (confirm('Clear this chat? This cannot be undone.')) {
            if (this.state.currentChat) {
                this.state.conversations[this.state.currentChat] = [];
                this.elements.chatContainer.innerHTML = '';
                this.saveState();
                this.showToast('Chat cleared');
            }
        }
    }
    
    clearAllChats() {
        if (confirm('Clear all chat histor