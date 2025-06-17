function renderLoginForm(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <form id="loginForm">
            <div>
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div>
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Login</button>
        </form>
    `;
}

async function handleLoginSubmit(event, callback) {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = ''; // Clear previous messages

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        // Assuming token is in data.token
        if (data.token) {
            localStorage.setItem('jwtToken', data.token);
            localStorage.setItem('dl_username', data.user.username); // Store username for display
            messagesDiv.className = 'success';
            messagesDiv.textContent = `Login successful! Welcome ${data.user.username}.`;
            if (callback) callback(true); // Signal successful login
        } else {
            throw new Error(data.message || 'Login failed: No token received.');
        }

    } catch (error) {
        console.error('Login error:', error);
        messagesDiv.className = 'error';
        messagesDiv.textContent = `Login failed: ${error.message}`;
        if (callback) callback(false); // Signal failed login
    }
}
