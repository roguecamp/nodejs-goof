function renderFileUploadForm(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const username = localStorage.getItem('dl_username') || 'User';

    container.innerHTML = `
        <p>Welcome, ${username}! You can upload a text file here.</p>
        <form id="fileUploadForm">
            <div>
                <label for="textFile">Choose a .txt file:</label>
                <input type="file" id="textFile" name="textFile" accept=".txt" required>
            </div>
            <button type="submit">Upload File</button>
        </form>
    `;
}

async function handleFileUploadSubmit(event, callback) {
    event.preventDefault();
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = ''; // Clear previous messages

    const fileInput = event.target.textFile;
    const file = fileInput.files[0];

    if (!file) {
        messagesDiv.className = 'error';
        messagesDiv.textContent = 'Please select a file to upload.';
        if (callback) callback(false);
        return;
    }

    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
        messagesDiv.className = 'error';
        messagesDiv.textContent = 'Invalid file type. Please select a .txt file.';
        if (callback) callback(false);
        return;
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) {
        messagesDiv.className = 'error';
        messagesDiv.textContent = 'Authentication error. Please login again.';
        // Optionally, redirect to login
        if (callback) callback(false, true); // Signal auth error
        return;
    }

    const formData = new FormData();
    formData.append('textFile', file);

    try {
        const response = await fetch('/api/ingestion/upload/text', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // 'Content-Type': 'multipart/form-data' is set automatically by browser with FormData
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        messagesDiv.className = 'success';
        messagesDiv.textContent = `File uploaded successfully! Server says: ${data.message} (ID: ${data.data.id})`;
        event.target.reset(); // Clear the form
        if (callback) callback(true);

    } catch (error) {
        console.error('File upload error:', error);
        messagesDiv.className = 'error';
        messagesDiv.textContent = `File upload failed: ${error.message}`;
        if (error.message.includes('Token expired') || error.message.includes('Invalid token')) {
             if (callback) callback(false, true); // Signal auth error
        } else {
             if (callback) callback(false);
        }
    }
}
