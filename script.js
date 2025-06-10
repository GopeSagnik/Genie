// --- NEW: Font Size Adjustment Variables and Elements ---
const fontSizeDecreaseBtn = document.getElementById('font-size-decrease');
const fontSizeDefaultBtn = document.getElementById('font-size-default'); // NEW: Default button reference
const fontSizeIncreaseBtn = document.getElementById('font-size-increase');
// Removed genieInfoButton reference as requested

const rootElement = document.documentElement; // This refers to the <html> tag

const FONT_SIZE_STEP = 0.1; // Adjust font size by 0.1rem
const MIN_FONT_SIZE = 0.8;  // Minimum font size in rem (e.g., 80% of base)
const MAX_FONT_SIZE = 1.4;  // Maximum font size in rem (e.g., 140% of base)
const INITIAL_DEFAULT_FONT_SIZE = 1.0; // Define the absolute default font size in rem

// Get the initial font size from the CSS variable.
// This will be `1rem` if not explicitly set in CSS, or whatever you define.
// We need to parse it as a float because getPropertyValue returns a string like "1rem".
// If the variable isn't defined or invalid, default to INITIAL_DEFAULT_FONT_SIZE.
let currentMessageFontSize = parseFloat(getComputedStyle(rootElement).getPropertyValue('--message-base-font-size')) || INITIAL_DEFAULT_FONT_SIZE;

// Function to apply the font size and save it to localStorage
function updateMessageFontSize() {
    // Ensure font size stays within min/max bounds
    currentMessageFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, currentMessageFontSize));
    
    // Set the CSS custom property on the root element (<html>)
    rootElement.style.setProperty('--message-base-font-size', `${currentMessageFontSize}rem`);
    
    // Save the preference to local storage
    localStorage.setItem('chatbotMessageFontSize', currentMessageFontSize.toString());
}

// Load saved font size on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedFontSize = parseFloat(localStorage.getItem('chatbotMessageFontSize'));
    if (!isNaN(savedFontSize)) { // Check if a valid number was retrieved
        currentMessageFontSize = savedFontSize;
    }
    updateMessageFontSize(); // Apply initial or saved font size
});

// Event listeners for the font size buttons
if (fontSizeDecreaseBtn) { // Check if the button exists before adding listener
    fontSizeDecreaseBtn.addEventListener('click', () => {
        currentMessageFontSize -= FONT_SIZE_STEP;
        updateMessageFontSize();
    });
}

if (fontSizeDefaultBtn) { // NEW: Event listener for default font size button
    fontSizeDefaultBtn.addEventListener('click', () => {
        currentMessageFontSize = INITIAL_DEFAULT_FONT_SIZE; // Reset to default
        updateMessageFontSize();
    });
}

if (fontSizeIncreaseBtn) { // Check if the button exists before adding listener
    fontSizeIncreaseBtn.addEventListener('click', () => {
        currentMessageFontSize += FONT_SIZE_STEP;
        updateMessageFontSize();
    });
}

// Removed Genie Info button event listener as requested


// --- END NEW FONT SIZE ADJUSTMENT CODE ---


// --- Existing Chatbot Functionality Code ---
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

function addMessage(message, sender) {
    const messageElement = document.createElement('div');
    // For every message bubble, regardless of sender, wrap content in a wrapper
    // and add the message class. This ensures common styling.
    messageElement.classList.add('message', `${sender}-message`);

    if (sender === 'bot') {
        // For bot messages, parse Markdown into HTML
        const messageContent = document.createElement('div');
        messageContent.innerHTML = marked.parse(message); // `marked` library should be included in HTML
        messageContent.classList.add('bot-message-content'); // Add a class for specific styling

        // Create the copy button
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        // SVG for clipboard icon
        copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        copyButton.title = 'Copy to clipboard'; // Tooltip for accessibility

        // Attach click event listener to the copy button
        copyButton.addEventListener('click', () => {
            // Use a temporary textarea to copy the text (textContent ignores HTML, handles newlines)
            const textToCopy = messageContent.textContent || messageContent.innerText;
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = textToCopy;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();

            try {
                const successful = document.execCommand('copy'); // Deprecated but widely supported for iframes
                const msg = successful ? 'Copied!' : 'Failed to copy.';
                console.log(msg);

                // Provide visual feedback
                const originalButtonContent = copyButton.innerHTML;
                copyButton.innerHTML = 'Copied!';
                copyButton.style.backgroundColor = '#10B981'; // Green for success
                setTimeout(() => {
                    copyButton.innerHTML = originalButtonContent;
                    copyButton.style.backgroundColor = ''; // Reset background
                }, 2000); // Reset after 2 seconds

            } catch (err) {
                console.error('Oops, unable to copy', err);
            } finally {
                document.body.removeChild(tempTextArea); // Always remove the temporary textarea
            }
        });

        // Append the content and the button to the message element
        messageElement.appendChild(messageContent);
        messageElement.appendChild(copyButton);

    } else {
        // For user messages, just set textContent (newlines handled by CSS)
        // We use textContent for user input to prevent HTML injection attacks
        messageElement.textContent = message;
    }

    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight; // Scroll to bottom
}


// Function to send message to Gemini API
async function sendMessage() {
    const message = userInput.value.trim();
    if (message === "") return;

    // Optional: Clean up multiple newlines from user input before sending to bot
    // message = message.replace(/\n{3,}/g, '\n\n'); 

    addMessage(message, 'user');
    userInput.value = ''; // Clear input immediately
    userInput.style.height = 'auto'; // Reset textarea height after sending

    // Display a "typing..." or "thinking..." message
    // Note: A more advanced implementation might use a dedicated typing indicator div with dots animation
    const thinkingMessageElement = document.createElement('div');
    thinkingMessageElement.classList.add('message', 'bot-message'); // Give it message and bot-message classes for basic styling
    thinkingMessageElement.textContent = "Genie on your Request...🫡"; // Simple text indicator
    chatLog.appendChild(thinkingMessageElement);
    chatLog.scrollTop = chatLog.scrollHeight;

    try {
        const response = await fetch(`${BASE_API_URL}/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }]
            })
        });

        // Remove the "thinking..." message regardless of success or failure
        if (chatLog.contains(thinkingMessageElement)) {
            chatLog.removeChild(thinkingMessageElement);
        }

        // Check if the response was successful (status code 2xx)
        if (!response.ok) {
            const errorData = await response.json(); // Try to parse error details
            console.error("API call failed with status:", response.status, errorData);
            addMessage(`Error: ${errorData.error?.message || response.statusText}. Check console for details.`, 'bot');
            return; // Stop execution
        }

        const data = await response.json();
        console.log("Gemini API Response:", data); // Log the full response for inspection

        // Navigate the response structure to get the text
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            let botReply = data.candidates[0].content.parts[0].text;
            // Post-process the bot's reply to normalize multiple newlines
            // This replaces 2 or more consecutive newlines with exactly two, creating clean paragraph breaks.
            botReply = botReply.replace(/\n{2,}/g, '\n\n'); 

            addMessage(botReply, 'bot');
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            // Handle cases where the prompt was blocked by safety settings
            addMessage(`Sorry, your prompt was blocked due to: ${data.promptFeedback.blockReason}. Please try rephrasing.`, 'bot');
        }
        else {
            // Generic fallback if response structure is unexpected
            addMessage("Sorry, I couldn't get a valid response. The response structure might have changed or was empty.", 'bot');
        }

    } catch (error) {
        // Remove the "thinking..." message if an error occurred during fetch (redundant check, but safe)
        if (chatLog.contains(thinkingMessageElement)) {
            chatLog.removeChild(thinkingMessageElement);
        }
        console.error("Error communicating with Gemini API:", error);
        addMessage("An error occurred. Please try again later. Check the browser console for network errors.", 'bot');
    }
}

// Event listeners for sending messages
sendButton.addEventListener('click', sendMessage);

// Add keydown event listener for the textarea:
userInput.addEventListener('keydown', (event) => {
    // If Enter key is pressed
    if (event.key === 'Enter') {
        // If Shift key is NOT pressed (i.e., only Enter)
        if (!event.shiftKey) {
            event.preventDefault(); // Prevent default Enter behavior (like form submission)
            sendMessage(); // Send the message to the bot
        }
        // If Shift key IS pressed (Shift + Enter):
        // We do nothing here. The browser's default behavior for a <textarea>
        // when Shift+Enter is pressed is to insert a new line.
    }
});

// Auto-resize textarea based on content
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto'; // Reset height
    userInput.style.height = userInput.scrollHeight + 'px'; // Set to scrollHeight
});


// Initial bot message on page load
// This should ideally be the very last line to ensure all elements are defined
// and the font size is loaded before the first message is added.
addMessage("Hello! I'm Genie...😊 \nHow can I help you today?", 'bot');
