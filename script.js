const recognition = new window.webkitSpeechRecognition();
recognition.lang = "en-US";

recognition.onresult = function(event) {
  const input = event.results[0][0].transcript;
  document.getElementById("userInput").value = input;
  sendMessage();
};

function startMic() {
  const micBtn = document.querySelector('button[onclick="startMic()"]');
  micBtn.innerText = "🎤 Listening...";
  micBtn.disabled = true;

  recognition.start();

  recognition.onend = () => {
    micBtn.innerText = "🎙️";
    micBtn.disabled = false;
  };
}

function showTypingIndicator() {
  const log = document.getElementById("chatLog");
  const typingBubble = document.createElement("div");
  typingBubble.className = "message bot";
  typingBubble.id = "typingIndicator";
  typingBubble.innerHTML = `<em>StephBot is typing...</em>`;
  log.appendChild(typingBubble);
  log.scrollTop = log.scrollHeight;
}

function removeTypingIndicator() {
  const typingBubble = document.getElementById("typingIndicator");
  if (typingBubble) typingBubble.remove();
}

async function sendMessage() {
  const input = document.getElementById("userInput").value.trim();
  if (!input) return;

  appendMessage("You", input);
  document.getElementById("userInput").value = "";

  let reply = "";

  // Construct the query with a system prompt for brevity
  const queryWithPrompt = `In no more than 3 sentences, answer the following: ${input}`;

  // ntnl bot
  try {
    const response = await fetch("https://ntnl.solace-ai.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send the modified query to the NTNL API
      body: JSON.stringify({ query: queryWithPrompt })
    });

    if (!response.ok) {
      reply = "Sorry, I couldn't reach the Solace knowledge base right now.";
    } else {
      const data = await response.json();
      console.log("NTNL returned:", data);
      reply = data.response?.trim() || "Sorry, I couldn't find an answer for that.";
    }
  } catch (error) {
    console.error("NTNL API error:", error);
    reply = "There was an error connecting to Solace NTNL.";
  }

  // Display the text immediately after receiving it from NTNL
  appendMessage("StephBot", reply);

  // Then, initiate the text-to-speech
  speak(cleanTextForTTS(reply));
}

function appendMessage(sender, text) {
  const log = document.getElementById("chatLog");
  const bubble = document.createElement("div");

  bubble.className = sender === "You" ? "message user" : "message bot";
  bubble.innerHTML = `<strong>${sender}:</strong> ${text}`;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}

function cleanTextForTTS(raw) {
  let cleaned = raw;
  cleaned = cleaned.replace(/\*\*|__|\*|_|~~|`/g, '');
  cleaned = cleaned.replace(/(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}[^\s]*)/g, '');
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

// ElevenLabs with fallback
async function speak(text) {
  const ELEVENLABS_API_KEY = "api";
  const voiceId = "9PSFVIeBFh3iQoQKBzQF"; //9PSFVIeBFh3iQoQKBzQF

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      console.warn("ElevenLabs failed, falling back to browser TTS");
      fallbackTTS(text);
      return;
    }

    const audioData = await response.blob();
    const audioURL = URL.createObjectURL(audioData);
    const player = document.getElementById("voicePlayer");
    player.src = audioURL;
    // player.style.display = "block"; // <-- COMMENT OUT or REMOVE THIS LINE
    player.play();
  } catch (error) {
    console.error("ElevenLabs error:", error);
    fallbackTTS(text);
  }
}

function fallbackTTS(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-US";
  msg.pitch = 1.1;
  msg.rate = 0.95;
  speechSynthesis.speak(msg);
}

window.onload = function () {
  const opening = "Hi! I’m StephBot. How can I help you today?";
  appendMessage("StephBot", opening);
  speak(cleanTextForTTS(opening));
};

function closeChat() {
  document.querySelector(".chat-container").style.display = "none";
}
