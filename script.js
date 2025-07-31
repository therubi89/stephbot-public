// Initialize Web Speech Recognition API
const recognition = new window.webkitSpeechRecognition();
recognition.lang = "en-US";

// Event listener for speech recognition results
recognition.onresult = function(event) {
  const input = event.results[0][0].transcript;
  document.getElementById("userInput").value = input;
  sendMessage();
};

// Function to start microphone input for speech recognition
function startMic() {
  const micBtn = document.getElementById("micButton");
  micBtn.innerText = "🎤 Listening...";
  micBtn.disabled = true;

  recognition.start();

  recognition.onend = () => {
    micBtn.innerText = "🎙️";
    micBtn.disabled = false;
    const userInput = document.getElementById("userInput");
    const sendButton = document.getElementById("sendButton");
    if (userInput.value.trim() === "") {
        micBtn.style.display = 'block';
        sendButton.style.display = 'none';
    }
  };
}

// Function to display a typing indicator for StephBot
function showTypingIndicator() {
  const log = document.getElementById("chatLog");
  const typingBubble = document.createElement("div");
  typingBubble.className = "message bot";
  typingBubble.id = "typingIndicator";
  typingBubble.innerHTML = `<em>StephBot is typing...</em>`;
  log.appendChild(typingBubble);
  log.scrollTop = log.scrollHeight;
}

// Function to remove the typing indicator
function removeTypingIndicator() {
  const typingBubble = document.getElementById("typingIndicator");
  if (typingBubble) typingBubble.remove();
}

// Global variable to store chat history for conversational context
// We'll store an array of { role: 'user'/'assistant', content: 'text' }
const chatHistory = [];
const MAX_HISTORY_LENGTH = 5; // Keep only the last 5 turns (user + bot pairs)

// Function to send a message
async function sendMessage() {
  const input = document.getElementById("userInput").value.trim();
  if (!input) return;

  // Append user message to chat history and display
  appendMessage("You", input);
  chatHistory.push({ role: "user", content: input });
  // Trim history to maintain context window size
  if (chatHistory.length > MAX_HISTORY_LENGTH * 2) { // *2 because each turn is user+bot
      chatHistory.splice(0, chatHistory.length - MAX_HISTORY_LENGTH * 2);
  }

  document.getElementById("userInput").value = ""; // Clear input immediately

  // After sending, ensure mic button is shown and send button is hidden
  document.getElementById("sendButton").style.display = 'none';
  document.getElementById("micButton").style.display = 'block';

  showTypingIndicator();

  let reply = "";

  // --- MODIFIED: Prepare query for NTNL, concatenating history into the 'query' string ---
  const historicalContext = chatHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

  // Combine historical context with the current query and the brevity instruction
  // The LLM will parse this combined string to understand context.
  const finalQueryForNTNL = `${historicalContext}\nUser: ${input}\n\nIn no more than 3 sentences, please answer the user's last question based on the conversation history.`;
  // --- END MODIFIED ---

  try {
    const response = await fetch(`https://ntnl.solace-ai.com/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          query: finalQueryForNTNL // Send the combined query string
      })
    });

    if (!response.ok) {
      reply = "Sorry, I couldn't reach the Solace knowledge base right now. Please try again later.";
    } else {
      const data = await response.json();
      console.log("NTNL returned:", data);
      reply = data.response?.trim() || "Sorry, I couldn't find an answer for that in my general knowledge base.";
    }
  } catch (error) {
    console.error("NTNL API error:", error);
    reply = "There was an error connecting to Solace NTNL for general questions.";
  }

  removeTypingIndicator();
  // Append StephBot's reply to chat history and display
  appendMessage("StephBot", reply);
  chatHistory.push({ role: "assistant", content: reply });

  speak(cleanTextForTTS(reply));
}

// Function to append messages to the chat log
function appendMessage(sender, text) {
  const log = document.getElementById("chatLog");
  const bubble = document.createElement("div");

  bubble.className = sender === "You" ? "message user" : "message bot";
  bubble.innerHTML = `<strong>${sender}:</strong> ${text}`;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}

// Function to clean text for Text-to-Speech
function cleanTextForTTS(raw) {
  let cleaned = raw;
  cleaned = cleaned.replace(/\*\*|__|\*|_|~~|`/g, '');
  cleaned = cleaned.replace(/(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}[^\s]*)/g, '');
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

// ElevenLabs Text-to-Speech with fallback (via Netlify Function)
async function speak(text) {
  const voiceId = "9PSFVIeBFh3iQoQKBzQF";

  try {
    const response = await fetch(`/.netlify/functions/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        voiceId: voiceId,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.3, similarity_boost: 0.75 }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn("Netlify Function or ElevenLabs failed:", errorData.error);
      fallbackTTS(text);
      return;
    }

    const audioData = await response.blob();
    const audioURL = URL.createObjectURL(audioData);
    const player = document.getElementById("voicePlayer");
    player.src = audioURL;
    player.play();
  } catch (error) {
    console.error("Error calling Netlify Function:", error);
    fallbackTTS(text);
  }
}

// Fallback Text-to-Speech using browser's SpeechSynthesis API
function fallbackTTS(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-US";
  msg.pitch = 1.1;
  msg.rate = 0.95;
  speechSynthesis.speak(msg);
}

// --- Feedback Modal Functions ---
function showFeedbackModal() {
  document.getElementById("feedbackModal").classList.remove("hidden");
}

function closeFeedbackModal() {
  document.getElementById("feedbackModal").classList.add("hidden");
  document.getElementById("feedbackText").value = "";
}

function submitFeedback() {
  const feedbackText = document.getElementById("feedbackText").value.trim();
  if (feedbackText) {
    console.log("User Feedback Submitted:", feedbackText);
    appendMessage("StephBot", "Thank you for your feedback! We truly appreciate your input and it helps us improve Solace AI for ministry.");
    speak("Thank you for your feedback! We truly appreciate your input and it helps us improve Solace AI for ministry.");
  } else {
    appendMessage("StephBot", "Please type some feedback before submitting.");
    speak("Please type some feedback before submitting.");
  }
  closeFeedbackModal();
}

// --- Widget Toggle Functions ---
let isChatOpen = false;
let hasWelcomed = false;

function toggleChat() {
  const chatContainer = document.getElementById("chatContainer");
  const chatIconSymbol = document.getElementById("chatIconText"); // Bottom right icon
  const topRightToggle = document.getElementById("topRightToggle"); // Top right icon

  if (isChatOpen) {
    // Close the chat (collapse)
    chatContainer.classList.remove("active");
    // Change bottom icon back to chat bubble after animation
    setTimeout(() => {
      chatIconSymbol.textContent = '💬'; // Back to chat icon
      chatContainer.style.display = 'none'; // Fully hide after animation
    }, 300); // Match CSS transition duration
    //topRightToggle.textContent = '─'; // Set top right to collapse (FinBot style)
  } else {
    // Open the chat (expand)
    chatContainer.style.display = 'flex';
    chatContainer.offsetHeight; // Force reflow
    chatContainer.classList.add("active");
    chatIconSymbol.textContent = '✖'; // Change bottom icon to '⌄'
    //topRightToggle.textContent = '⤢'; // Change top right to expand (FinBot style)

    if (!hasWelcomed) {
      const opening = "Hi! I’m StephBot, your AI assistant for the Solace Training Academy. How can I help you today?";
      appendMessage("StephBot", opening);
      chatHistory.push({ role: "assistant", content: opening }); // Add welcome message to history
      speak(cleanTextForTTS(opening));
      hasWelcomed = true;
    }
  }
  isChatOpen = !isChatOpen;
}

// --- Menu Toggle Functions and Download Transcript ---

function toggleMenu() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    dropdownMenu.classList.toggle('active');
}

// Close the dropdown menu if the user clicks outside of it
window.addEventListener('click', function(event) {
    const menuButton = document.getElementById('menuButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu.classList.contains('active') && !menuButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.remove('active');
    }
});


function downloadTranscript() {
    const chatLogDiv = document.getElementById('chatLog');
    const messages = chatLogDiv.querySelectorAll('.message');
    let transcriptText = "StephBot Chat Transcript\n\n";

    messages.forEach(messageDiv => {
        const sender = messageDiv.querySelector('strong').textContent.replace(':', '').trim();
        const text = messageDiv.textContent.replace(sender + ':', '').trim();
        transcriptText += `${sender}: ${text}\n`;
    });

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'stephbot_chat_transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up the object URL

    // Close the menu after download
    document.getElementById('dropdownMenu').classList.remove('active');
}


// --- Page Load & Input Listener ---
window.onload = function () {
  const chatContainer = document.getElementById("chatContainer");
  chatContainer.style.display = 'none'; // Start hidden

  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const micButton = document.getElementById("micButton");

  // Initial state: Mic visible, Send hidden
  sendButton.style.display = 'none';
  micButton.style.display = 'block';

  // Event listener for input field to toggle Send/Mic buttons
  userInput.addEventListener('input', function() {
    if (this.value.trim() !== "") {
      // User is typing, show Send, hide Mic
      sendButton.style.display = 'block';
      micButton.style.display = 'none';
    } else {
      // Input is empty, show Mic, hide Send
      sendButton.style.display = 'none';
      micButton.style.display = 'block';
    }
  });
};