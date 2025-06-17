document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const appContentSection = document.getElementById('app-content'); // Container for Upload and Chat

    const uploadSection = document.getElementById('upload-section');
    const chatSection = document.getElementById('chat-section');

    const loginFormContainerId = 'login-form-container';
    const fileUploadContainerId = 'file-upload-container';
    const chatUiContainerId = 'chat-ui-container';

    const logoutButton = document.getElementById('logoutButton');
    const navToUploadButton = document.getElementById('navToUpload');
    const navToChatButton = document.getElementById('navToChat');

    const messagesDiv = document.getElementById('messages');

    function clearMessages() {
        messagesDiv.innerHTML = '';
        messagesDiv.className = '';
    }

    function showLoginView() {
        clearMessages();
        loginSection.classList.remove('hidden');
        appContentSection.classList.add('hidden');
        uploadSection.classList.add('hidden'); // Ensure these are hidden too
        chatSection.classList.add('hidden');

        renderLoginForm(loginFormContainerId);
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (event) => handleLoginSubmit(event, onLoginResult));
        }
    }

    function showAppContentView(defaultView = 'upload') { // 'upload' or 'chat'
        clearMessages();
        loginSection.classList.add('hidden');
        appContentSection.classList.remove('hidden');

        if (defaultView === 'chat') {
            showChatView();
        } else {
            showUploadView();
        }
    }

    function showUploadView() {
        uploadSection.classList.remove('hidden');
        chatSection.classList.add('hidden');
        navToUploadButton.classList.add('active');
        navToChatButton.classList.remove('active');
        renderFileUploadForm(fileUploadContainerId);
        const fileUploadForm = document.getElementById('fileUploadForm');
        if (fileUploadForm) {
            fileUploadForm.addEventListener('submit', (event) => handleFileUploadSubmit(event, onUploadResult));
        }
    }

    function showChatView() {
        uploadSection.classList.add('hidden');
        chatSection.classList.remove('hidden');
        navToChatButton.classList.add('active');
        navToUploadButton.classList.remove('active');
        const username = localStorage.getItem('dl_username');
        Chat.renderChatInterface(chatUiContainerId, username, handleChatAuthError);
    }

    function onLoginResult(success) {
        if (success) {
            showAppContentView('upload'); // Default to upload view after login
        } else {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('dl_username');
        }
    }

    function onUploadResult(success, isAuthError = false) {
        if (!success && isAuthError) {
            messagesDiv.className = 'error'; // Already set by FileUpload.js but can be reinforced
            messagesDiv.textContent = 'Authentication error or session expired. Please login again.';
            logout();
        }
    }

    function handleChatAuthError() {
        messagesDiv.className = 'error';
        messagesDiv.textContent = 'Chat authentication error or session expired. Please login again.';
        logout();
    }

    function logout() {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('dl_username');
        messagesDiv.className = 'success';
        messagesDiv.textContent = 'Logged out successfully.';
        showLoginView();
    }

    logoutButton.addEventListener('click', logout);
    navToUploadButton.addEventListener('click', showUploadView);
    navToChatButton.addEventListener('click', showChatView);

    // Initial state check
    const token = localStorage.getItem('jwtToken');
    if (token) {
        showAppContentView('upload'); // Default to upload view if already logged in
    } else {
        showLoginView();
    }
});
