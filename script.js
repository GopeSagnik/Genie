const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// **WARNING: Exposing API key directly in frontend is NOT secure for production.**
// This is for demonstration/prototyping only.
const API_KEY = "AIzaSyD5Fg1XG5JwTaN2XRpIKzUvnozBaH9oL4g"; // <<-- REPLACE THIS WITH YOUR ACTUAL API KEY
const MODEL_NAME = "gemini-2.0-flash"; // Correct model name for 1.5 Flash

// Base URL for the Gemini API
// Make sure this is correct for the region and version you are using.
// v1beta is commonly used.
const BASE_API_URL = "https://generativelanguage.googleapis.com/v1beta";

// Function to add a message to the chat log
function addMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    // Basic sanitization for display (consider a more robust library for production)
    messageElement.textContent = message;
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight; // Scroll to bottom
}

// Function to send message to Gemini API
async function sendMessage() {
    const message = userInput.value.trim();
    if (message === "") return;

    addMessage(message, 'user');
    userInput.value = ''; // Clear input immediately

    // Display a "typing..." or "thinking..." message
    const thinkingMessageElement = document.createElement('div');
    thinkingMessageElement.classList.add('message', 'bot-message');
    thinkingMessageElement.textContent = "Genie is thinking...";
    chatLog.appendChild(thinkingMessageElement);
    chatLog.scrollTop = chatLog.scrollHeight;

    try {
        const response = await fetch(`${BASE_API_URL}/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // No need for 'Accept' header for this API
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }]
            })
        });

        // Remove the "thinking..." message
        chatLog.removeChild(thinkingMessageElement);

        // Check if the response was successful (status code 2xx)
        if (!response.ok) {
            const errorData = await response.json(); // Try to parse error details
            console.error("API call failed with status:", response.status, errorData);
            addMessage(`Error: ${errorData.error.message || response.statusText}. Check console for details.`, 'bot');
            return; // Stop execution
        }

        const data = await response.json();
        console.log("Gemini API Response:", data); // Log the full response for inspection

        // Navigate the response structure to get the text
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
            const botReply = data.candidates[0].content.parts[0].text;
            addMessage(botReply, 'bot');
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            // Handle cases where the prompt was blocked
            addMessage(`Sorry, your prompt was blocked due to: ${data.promptFeedback.blockReason}. Please try rephrasing.`, 'bot');
        }
        else {
            addMessage("Sorry, I couldn't get a valid response from Gemini. The response structure might have changed or was empty.", 'bot');
        }

    } catch (error) {
        // Remove the "thinking..." message if an error occurred during fetch
        if (chatLog.contains(thinkingMessageElement)) {
            chatLog.removeChild(thinkingMessageElement);
        }
        console.error("Error communicating with Gemini API:", error);
        addMessage("An error occurred. Please try again later. Check the browser console for network errors.", 'bot');
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Initial bot message
addMessage("Hello! How can I help you today?", 'bot');