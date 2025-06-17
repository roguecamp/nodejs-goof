const Chat = (() => {
    let chatDisplayArea;
    let chatInput;
    let loadingIndicator; // Variable for the loading indicator element

    // Known fallback messages from backend (optional styling)
    const FALLBACK_MESSAGES = [
        "I don't have any information to draw from yet. Please upload some text data first so I can learn more about you.",
        "I couldn't find anything specific to that in your documents. Try asking about something else or rephrasing.",
        "That's an interesting thought. Could you elaborate a bit more, or ask about something specific from your documents?",
        "I'm not sure how to respond to that. Can you try asking differently?" // Default fallback
    ];

    function displayMessage(messageObject, currentUsername) {
        if (!chatDisplayArea) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-bubble');

        const senderName = messageObject.sender === 'user' ? currentUsername : 'Bot';

        messageDiv.classList.add(messageObject.sender === 'user' ? 'user-message' : 'bot-message');

        // Optional: Add special class for fallback messages
        if (messageObject.sender === 'bot' && FALLBACK_MESSAGES.includes(messageObject.text)) {
            messageDiv.classList.add('bot-fallback-message'); // Add CSS for this if desired
        }

        const senderSpan = document.createElement('div');
        senderSpan.classList.add('message-sender');
        senderSpan.textContent = senderName;

        const textSpan = document.createElement('div');
        textSpan.textContent = messageObject.text;

        const timestampSpan = document.createElement('div');
        timestampSpan.classList.add('message-timestamp');
        timestampSpan.textContent = new Date(messageObject.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


        messageDiv.appendChild(senderSpan);
        messageDiv.appendChild(textSpan);
        messageDiv.appendChild(timestampSpan);

        chatDisplayArea.appendChild(messageDiv);
        chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight; // Scroll to bottom
    }

    async function loadConversationHistory(username) {
        if (!chatDisplayArea) return;
        chatDisplayArea.innerHTML = '';
        const messagesDiv = document.getElementById('messages');
        const token = localStorage.getItem('jwtToken');

        if (!token) {
            messagesDiv.className = 'error';
            messagesDiv.textContent = 'Authentication error. Please login again.';
            return false;
        }

        try {
            const response = await fetch('/api/conversation/history', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const history = await response.json();
            history.forEach(msg => displayMessage(msg, username));
            return true;
        } catch (error) {
            console.error('Error loading history:', error);
            messagesDiv.className = 'error';
            messagesDiv.textContent = `Error loading history: ${error.message}`;
            return false;
        }
    }

    async function handleSendMessage(currentUsername) {
        const text = chatInput.value.trim();
        if (!text) return;

        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = '';
        const token = localStorage.getItem('jwtToken');

        if (!token) {
            messagesDiv.className = 'error';
            messagesDiv.textContent = 'Authentication error. Please login again.';
            return { success: false, authError: true };
        }

        loadingIndicator.classList.remove('hidden'); // Show loading indicator
        chatInput.disabled = true; // Disable input while processing
        document.getElementById('send-chat-message').disabled = true;


        const userMessage = {
            sender: 'user',
            text: text,
            timestamp: new Date().toISOString()
        };
        displayMessage(userMessage, currentUsername);
        chatInput.value = '';

        try {
            const response = await fetch('/api/conversation/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ text }),
            });

            const botResponse = await response.json();
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error(botResponse.message || 'Authentication error.', { cause: 'authError' });
                }
                throw new Error(botResponse.message || `HTTP error! status: ${response.status}`);
            }
            displayMessage(botResponse, currentUsername);
            return { success: true };
        } catch (error) {
            console.error('Error sending message:', error);
            messagesDiv.className = 'error';
            messagesDiv.textContent = `Error sending message: ${error.message}`;
            return { success: false, authError: error.cause === 'authError' };
        } finally {
            loadingIndicator.classList.add('hidden'); // Hide loading indicator
            chatInput.disabled = false; // Re-enable input
            document.getElementById('send-chat-message').disabled = false;
            chatInput.focus();
        }
    }

    async function handleDeleteHistory(username) {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = '';
        const token = localStorage.getItem('jwtToken');

        if (!confirm("Are you sure you want to delete your entire chat history? This cannot be undone.")) {
            return { success: false, userCancelled: true };
        }

        if (!token) {
            messagesDiv.className = 'error';
            messagesDiv.textContent = 'Authentication error. Please login again.';
            return { success: false, authError: true };
        }

        loadingIndicator.classList.remove('hidden'); // Show loading indicator during delete

        try {
            const response = await fetch('/api/conversation/history', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                     throw new Error(data.message || 'Authentication error.', { cause: 'authError' });
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            chatDisplayArea.innerHTML = '';
            messagesDiv.className = 'success';
            messagesDiv.textContent = data.message || 'History deleted successfully.';
            return { success: true };
        } catch (error) {
            console.error('Error deleting history:', error);
            messagesDiv.className = 'error';
            messagesDiv.textContent = `Error deleting history: ${error.message}`;
            return { success: false, authError: error.cause === 'authError' };
        } finally {
            loadingIndicator.classList.add('hidden'); // Hide loading indicator
        }
    }


    function renderChatInterface(containerId, username, onChatError) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const currentUsername = username || localStorage.getItem('dl_username') || 'User';

        container.innerHTML = `
            <p>Chatting as: <strong>${currentUsername}</strong></p>
            <div id="chat-display-area"></div>
            <div id="chat-loading-indicator" class="hidden" style="font-style: italic; color: #555; padding: 5px 0; height: 20px; text-align: center;">Bot is thinking...</div>
            <div id="chat-input-area">
                <textarea id="chat-message-input" placeholder="Type your message..."></textarea>
                <button id="send-chat-message">Send</button>
            </div>
            <button id="deleteHistoryButton" style="margin-top: 10px;">Delete History</button>
        `;

        chatDisplayArea = document.getElementById('chat-display-area');
        chatInput = document.getElementById('chat-message-input');
        loadingIndicator = document.getElementById('chat-loading-indicator'); // Get the loading indicator
        const sendButton = document.getElementById('send-chat-message');
        const deleteButton = document.getElementById('deleteHistoryButton');

        sendButton.addEventListener('click', async () => {
            const result = await handleSendMessage(currentUsername);
            if (!result.success && result.authError && onChatError) {
                onChatError();
            }
        });

        chatInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const result = await handleSendMessage(currentUsername);
                if (!result.success && result.authError && onChatError) {
                    onChatError();
                }
            }
        });

        deleteButton.addEventListener('click', async () => {
            const result = await handleDeleteHistory(currentUsername);
             if (!result.success && result.authError && onChatError) {
                onChatError();
            }
        });

        loadConversationHistory(currentUsername).then(success => {
            // No specific action on fail here, error is displayed by loadConversationHistory itself
        });
    }

    return {
        renderChatInterface,
    };
})();
