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
    // After listening, if input field is still empty, show mic and hide send
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

// Global variable to manage conversational state for practice scenarios
let conversationState = {
  mode: "normal", // "normal", "prompt_practice", "ethics_dilemma", "sermon_prompt_assist"
  step: 0,
  data: {} // To store context for multi-turn interactions
};

// --- CORE: Internal Knowledge Base for Training Academy Content ---
function getTrainingResponse(input) {
  const lowerInput = input.toLowerCase();

  // Reset conversation state if user starts a new general query
  if (conversationState.mode !== "normal" && !lowerInput.includes("practice") && !lowerInput.includes("help me start")) {
    conversationState = { mode: "normal", step: 0, data: {} };
  }

  // --- Track 2: Tools Onboarding Responses ---
  if (lowerInput.includes("dashboard") || lowerInput.includes("overview")) {
    return "The Solace AI Dashboard is your central hub for ministry insights. It shows key AI-driven metrics like prompt usage, giving you a quick overview of how AI is being used. You can also find notifications and quick access to all your AI tools here.";
  }
  if (lowerInput.includes("workflow") || lowerInput.includes("automate") || lowerInput.includes("bulletin announcement")) {
    return "AI Workflows help you automate repetitive ministry tasks, like drafting weekly bulletin announcements. You can create a workflow, add an 'AI Content Generation' step with a specific prompt (e.g., 'draft a concise bulletin announcement'), then set it to run on a schedule. Remember, all AI-generated content is human-reviewed!";
  }
  if (lowerInput.includes("analytics") || lowerInput.includes("metrics") || lowerInput.includes("impact")) {
    return "The Analytics Panel gives you insights into how your AI tools are performing. You can see AI content engagement (like email open rates) and prompt usage frequency. This helps you understand what's resonating and where AI is providing the most value. You can also export basic reports.";
  }
  if (lowerInput.includes("stephbot setup") || lowerInput.includes("configure stephbot") || lowerInput.includes("train stephbot") || lowerInput.includes("my voice")) {
    return "To set up StephBot, go to 'AI Agents' in your menu. You can customize her persona (friendly, formal, pastoral) and 'train' her by uploading your church's FAQs or specific denominational info. The more data you provide, the better she can assist your unique ministry 24/7!";
  }
  if (lowerInput.includes("feedback") || lowerInput.includes("bug") || lowerInput.includes("suggestion") || lowerInput.includes("improve product")) {
    return "Your feedback is vital for Solace AI's continuous improvement! You can provide feedback using the 'Provide Feedback' button below the chat, through quick survey pop-ups, or by contacting support directly. Your input helps us fix bugs and develop new features for ministry.";
  }

  // --- Cross-Cutting: StephBot AI Content Integration (Tracks 4, 5, 6, 10) ---

  // Track 5: AI Fluency Support
  if (lowerInput.includes("what is ai") || lowerInput.includes("generative ai")) {
    return "Generative AI, like Solace AI, is a tool that can create new content (text, ideas) based on your instructions. Think of it as a very knowledgeable but naive assistant. It learns from patterns in vast amounts of data to generate responses.";
  }
  if (lowerInput.includes("4ds") || lowerInput.includes("four ds") || lowerInput.includes("ai fluency")) {
    return "The AI Fluency Journey focuses on the '4 Ds': Delegation (what AI can do), Description (how to prompt AI clearly), Discernment (critically evaluating AI output), and Diligence (responsible follow-through). These are key to effective and ethical AI use in ministry. Andy Morgan will guide you through this module!";
  }
  if (lowerInput.includes("example of delegation")) {
    return "Delegation is deciding what tasks AI can handle. For example, delegating the first draft of a weekly bulletin announcement or a sermon outline to AI, rather than writing it from scratch. You still review and refine, but AI handles the initial heavy lifting.";
  }
  if (lowerInput.includes("practice description")) {
    conversationState.mode = "prompt_practice";
    conversationState.step = 1;
    return "Great! Let's practice 'Description'. Imagine you need an AI to draft a short social media post for your church's upcoming potluck. Your first prompt is 'Write a social media post about a potluck.' How can you make that prompt more *descriptive* to get a better output? Try adding details about the event.";
  }

  // Track 6: Prompt Engineering Support
  if (lowerInput.includes("how to write a good prompt") || lowerInput.includes("prompt engineering")) {
    return "Prompt engineering is the art of crafting effective instructions for AI. A good prompt needs context, a clear persona (e.g., 'Act as a youth pastor'), desired tone, format, and specific constraints. The more detail you give, the better the AI's output will be. Andy Morgan's module will teach you how to master this for ministry tasks!";
  }
  if (lowerInput.includes("what's a persona") || lowerInput.includes("persona priming")) {
    return "A 'persona' in prompting is telling the AI to adopt a specific role or identity, like 'Act as a seasoned theologian' or 'Respond as a friendly church administrator.' This helps the AI tailor its language and approach to your needs.";
  }
  if (lowerInput.includes("can you help me start a sermon prompt")) {
    conversationState.mode = "sermon_prompt_assist";
    conversationState.step = 1;
    return "Absolutely! Let's start building a sermon prompt. What scripture passage are you preaching on this week?";
  }

  // Track 4: Ethics & Formation Support
  if (lowerInput.includes("ethical concerns") || lowerInput.includes("responsible ai") || lowerInput.includes("is ai biased")) {
    return "Ethical AI in Ministry is crucial. Key concerns include: **Bias & Fairness** (AI reflecting societal biases), **Transparency** (understanding AI's logic), **Accountability** (human responsibility), **Privacy**, **Spiritual Dependence**, and **Misinformation**. Andy Morgan's module will help you navigate these complex areas responsibly.";
  }
  if (lowerInput.includes("ethical dilemma") || lowerInput.includes("practice ethics")) {
    conversationState.mode = "ethics_dilemma";
    conversationState.step = 1;
    return "Okay, let's consider an ethical dilemma. Imagine AI drafts a prayer for a sensitive congregational situation. What ethical principle from our training should you apply *first* when reviewing it?";
  }

  // Track 10: Analytics & Case Studies Support
  if (lowerInput.includes("how is my church using ai") || lowerInput.includes("ai usage data")) {
    return "I can give you some insights based on your church's simulated usage data. For detailed, real-time metrics, you'll want to check your 'Impact Dashboard' in the Solace platform. What specific data are you curious about?";
  }
  if (lowerInput.includes("most popular ai-generated content")) {
    return "Based on simulated data, your church's most popular AI-generated content recently has been 'Weekly Bulletin Announcements' and 'Social Media Posts for Events'. This suggests AI is helping you most with communications!";
  }
  if (lowerInput.includes("how can i see our ai impact")) {
    return "You can see your AI's impact in the 'Impact Dashboard' and 'Analytics Panel' within the Solace platform. These show metrics like prompt usage, content engagement, and help you track your 'Ministry Wins'.";
  }

  // --- Conversational State-based Responses (for multi-turn practice) ---
  if (conversationState.mode === "prompt_practice") {
    if (conversationState.step === 1) {
      conversationState.step = 2;
      conversationState.data.initialPrompt = input;
      return "Good start! Now, what's the *tone* you're aiming for? Is it casual, formal, exciting, or something else?";
    } else if (conversationState.step === 2) {
      conversationState.mode = "normal";
      return `Excellent! By adding details like '${conversationState.data.initialPrompt}' and a '${input}' tone, your prompt is much more descriptive. This is great 'Description' in action!`;
    }
  }

  if (conversationState.mode === "sermon_prompt_assist") {
    if (conversationState.step === 1) {
      conversationState.data.scripture = input;
      conversationState.step = 2;
      return `Okay, ${input}. Who is the target audience for this sermon (e.g., youth, general congregation, new members)?`;
    } else if (conversationState.step === 2) {
      conversationState.data.audience = input;
      conversationState.step = 3;
      return `Got it. What are 2-3 key theological points or themes you want to ensure are included in the sermon outline?`;
    } else if (conversationState.step === 3) {
      conversationState.data.themes = input;
      conversationState.mode = "normal";
      return `Perfect! With scripture: ${conversationState.data.scripture}, audience: ${conversationState.data.audience}, and themes: ${conversationState.data.themes}, you have a strong prompt for a sermon outline. Now you can use the 'Sermon Outline Generator' template in Solace AI!`;
    }
  }

  if (conversationState.mode === "ethics_dilemma") {
    if (conversationState.step === 1) {
      conversationState.mode = "normal";
      return `That's a very insightful point! When reviewing AI-drafted prayers for sensitive situations, ensuring **Spiritual Authenticity** and **Human Accountability** are paramount. You must discern if it truly reflects your pastoral heart and theological stance. How would you ensure transparency if you used parts of it?`;
    }
  }

  return null;
}

// Function to send a message
async function sendMessage() {
  const input = document.getElementById("userInput").value.trim();
  if (!input) return;

  appendMessage("You", input);
  document.getElementById("userInput").value = ""; // Clear input immediately

  // After sending, ensure mic button is shown and send button is hidden
  document.getElementById("sendButton").style.display = 'none';
  document.getElementById("micButton").style.display = 'block';

  showTypingIndicator();

  let reply = "";

  const trainingResponse = getTrainingResponse(input);
  if (trainingResponse) {
    reply = trainingResponse;
  } else {
    const queryWithPrompt = `In no more than 3 sentences, answer the following: ${input}`;
    try {
      const response = await fetch(`/.netlify/functions/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryWithPrompt })
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
  }

  removeTypingIndicator();
  appendMessage("StephBot", reply);
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
  const voiceId = "9PSFVIeBFh3iQoQKBzQh";

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

// --- Widget Toggle Functions (from your recent updates) ---
let isChatOpen = false; // Track the state of the chat widget
let hasWelcomed = false; // To ensure welcome message only plays once per open

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
    
  } else {
    // Open the chat (expand)
    chatContainer.style.display = 'flex';
    chatContainer.offsetHeight; // Force reflow
    chatContainer.classList.add("active");
    chatIconSymbol.textContent = '✖'; // Change bottom icon to '⌄'
    //topRightToggle.textContent = '-'; 

    if (!hasWelcomed) {
      const opening = "Hi! I’m StephBot, your AI assistant for the Solace Training Academy. How can I help you today?";
      appendMessage("StephBot", opening);
      speak(cleanTextForTTS(opening));
      hasWelcomed = true;
    }
  }
  isChatOpen = !isChatOpen;
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
  micButton.style.display = 'block'; // Use 'block' for consistent button behavior

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