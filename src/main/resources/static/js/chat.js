// ===== CHAT APPLICATION JAVASCRIPT =====

// Get room and user data from hidden inputs
const roomId = document.getElementById('room-id').value;
const username = document.getElementById('username-data').value;

// WebSocket connection variables
let stompClient = null;
let isConnected = false;
let typingTimeout = null;

// DOM elements
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const connectionStatus = document.getElementById('connection-status');
const typingIndicator = document.getElementById('typing-indicator');
const charCount = document.getElementById('char-count');
const leaveRoomBtn = document.getElementById('leave-room-btn');

// ===== INITIALIZE CONNECTION =====
function connect() {
    // Create WebSocket connection using SockJS
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    // Disable debug logs for cleaner console
    stompClient.debug = null;

    // Connect to WebSocket server
    stompClient.connect({}, onConnected, onError);
}

// ===== CONNECTION SUCCESS =====
function onConnected() {
    isConnected = true;
    updateConnectionStatus(true);

    // Subscribe to room messages
    stompClient.subscribe(`/topic/room/${roomId}`, onMessageReceived);

    // Subscribe to typing indicators
    stompClient.subscribe(`/topic/typing/${roomId}`, onTypingReceived);

    // Send join notification
    sendJoinNotification();

    // Load previous messages
    loadMessages();
}

// ===== CONNECTION ERROR =====
function onError(error) {
    isConnected = false;
    updateConnectionStatus(false);
    console.error('WebSocket connection error:', error);

    // Show error message
    addSystemMessage('Connection failed. Please refresh the page.');

    // Retry connection after 5 seconds
    setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
    }, 5000);
}

// ===== UPDATE CONNECTION STATUS UI =====
function updateConnectionStatus(connected) {
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.querySelector('span:last-child') || connectionStatus;

    if (connected) {
        statusDot.classList.add('connected');
        if (statusText) statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('connected');
        if (statusText) statusText.textContent = 'Disconnected';
    }
}

// ===== SEND JOIN NOTIFICATION =====
function sendJoinNotification() {
    if (stompClient && isConnected) {
        const joinMessage = {
            sender: username,
            roomId: roomId,
            content: `${username} joined the chat`
        };

        stompClient.send(`/app/join/${roomId}`, {}, JSON.stringify(joinMessage));
    }
}

// ===== SEND LEAVE NOTIFICATION =====
function sendLeaveNotification() {
    if (stompClient && isConnected) {
        const leaveMessage = {
            sender: username,
            roomId: roomId,
            content: `${username} left the chat`
        };

        stompClient.send(`/app/leave/${roomId}`, {}, JSON.stringify(leaveMessage));
    }
}

// ===== LOAD PREVIOUS MESSAGES =====
async function loadMessages() {
    try {
        const response = await fetch(`/api/v1/rooms/${roomId}/messages?page=0&size=50`);

        if (response.ok) {
            const messages = await response.json();
            messages.forEach(message => displayMessage(message));
            scrollToBottom();
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// ===== SEND MESSAGE =====
function sendMessage(event) {
    event.preventDefault();

    const messageContent = messageInput.value.trim();

    // Validate message
    if (!messageContent) return;
    if (!isConnected) {
        addSystemMessage('Cannot send message. Not connected to server.');
        return;
    }

    // Create message object
    const chatMessage = {
        sender: username,
        content: messageContent,
        roomId: roomId
    };

    // Send message via WebSocket
    stompClient.send(`/app/sendMessage/${roomId}`, {}, JSON.stringify(chatMessage));

    // Clear input and reset character count
    messageInput.value = '';
    updateCharCount();

    // Stop typing indicator
    sendTypingIndicator(false);
}

// ===== RECEIVE MESSAGE =====
function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    displayMessage(message);
    scrollToBottom();
}

// ===== DISPLAY MESSAGE IN CHAT =====
function displayMessage(message) {
    const messageElement = document.createElement('div');

    // Handle different message types
    if (message.messageType === 'JOIN' || message.messageType === 'LEAVE') {
        messageElement.className = 'system-message';
        messageElement.innerHTML = `<p>${escapeHtml(message.content)}</p>`;
    } else {
        // Regular chat message
        const isOwnMessage = message.sender === username;
        messageElement.className = `message ${isOwnMessage ? 'message-own' : 'message-other'}`;

        const time = formatTime(message.timeStamp);
        const avatar = getAvatar(message.sender);

        if (isOwnMessage) {
            messageElement.innerHTML = `
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${escapeHtml(message.sender)}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${escapeHtml(message.content)}</div>
                </div>
                <div class="message-avatar">${avatar}</div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${escapeHtml(message.sender)}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${escapeHtml(message.content)}</div>
                </div>
            `;
        }
    }

    messagesContainer.appendChild(messageElement);
}

// ===== ADD SYSTEM MESSAGE =====
function addSystemMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';
    messageElement.innerHTML = `<p>${escapeHtml(text)}</p>`;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// ===== TYPING INDICATOR =====
function sendTypingIndicator(isTyping) {
    if (stompClient && isConnected) {
        const typingData = {
            username: username,
            isTyping: isTyping
        };

        stompClient.send(`/app/typing/${roomId}`, {}, JSON.stringify(typingData));
    }
}

// ===== RECEIVE TYPING INDICATOR =====
function onTypingReceived(payload) {
    const data = JSON.parse(payload.body);

    // Don't show typing indicator for own messages
    if (data.username === username) return;

    const typingText = typingIndicator.querySelector('.typing-text');

    if (data.isTyping) {
        typingText.textContent = `${data.username} is typing`;
        typingIndicator.style.display = 'flex';
    } else {
        typingIndicator.style.display = 'none';
    }
}

// ===== HANDLE INPUT TYPING =====
function handleTyping() {
    // Send typing indicator
    sendTypingIndicator(true);

    // Clear previous timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    // Stop typing indicator after 2 seconds of no input
    typingTimeout = setTimeout(() => {
        sendTypingIndicator(false);
    }, 2000);
}

// ===== UPDATE CHARACTER COUNT =====
function updateCharCount() {
    const count = messageInput.value.length;
    charCount.textContent = `${count}/2000`;

    if (count > 1900) {
        charCount.style.color = 'var(--danger)';
    } else {
        charCount.style.color = 'var(--gray)';
    }
}

// ===== SCROLL TO BOTTOM =====
function scrollToBottom() {
    const container = document.getElementById('messages-container');
    container.scrollTop = container.scrollHeight;
}

// ===== FORMAT TIMESTAMP =====
function formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();

    // Check if message is from today
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// ===== GET USER AVATAR =====
function getAvatar(name) {
    if (!name) return '?';

    // Get first letter of username
    const initial = name.charAt(0).toUpperCase();

    // Generate color based on username
    const colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
        '#10b981', '#06b6d4', '#ef4444', '#84cc16'
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const color = colors[Math.abs(hash) % colors.length];

    return `<div style="background: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1rem;">${initial}</div>`;
}

// ===== ESCAPE HTML (XSS PROTECTION) =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== LEAVE ROOM =====
function leaveRoom() {
    if (confirm('Are you sure you want to leave this room?')) {
        sendLeaveNotification();

        // Disconnect WebSocket
        if (stompClient) {
            stompClient.disconnect(() => {
                console.log('Disconnected from WebSocket');
            });
        }

        // Redirect to home page
        setTimeout(() => {
            window.location.href = '/';
        }, 500);
    }
}

// ===== EVENT LISTENERS =====

// Form submit
messageForm.addEventListener('submit', sendMessage);

// Input typing
messageInput.addEventListener('input', () => {
    handleTyping();
    updateCharCount();
});

// Leave room button
leaveRoomBtn.addEventListener('click', leaveRoom);

// Leave room on page close/refresh
window.addEventListener('beforeunload', () => {
    sendLeaveNotification();
});

// Prevent accidental page close
window.addEventListener('beforeunload', (e) => {
    if (messagesContainer.children.length > 1) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Handle enter key (send message)
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(e);
    }
});

// Focus input on load
window.addEventListener('load', () => {
    messageInput.focus();
});

// ===== START CONNECTION ON PAGE LOAD =====
connect();

console.log(`Chat initialized for room: ${roomId}, user: ${username}`);