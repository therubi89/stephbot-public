// netlify/functions/speak.js

const { WebSocket } = require('ws');

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!ELEVENLABS_API_KEY) {
    console.error("ElevenLabs API Key is not set in Netlify environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error: API key missing." }),
    };
  }

  const { text, voiceId, modelId, voiceSettings } = JSON.parse(event.body);

  return new Promise((resolve, reject) => {
    try {
      // --- CORRECTED: Pass API key as a query parameter in the URL ---
      const ws = new WebSocket(`wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-with-timestamps?model_id=${modelId}&xi_api_key=${ELEVENLABS_API_KEY}`);
      let audioChunks = [];

      ws.onopen = () => {
        console.log('WebSocket connection opened.');
        // Send the BOS (Beginning of Stream) message. The API key is already in the URL.
        ws.send(JSON.stringify({
          text: " ",
          voice_settings: voiceSettings,
        }));
        
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        for (const sentence of sentences) {
          ws.send(JSON.stringify({ text: sentence }));
        }

        ws.send(JSON.stringify({ text: "" }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.audio) {
          audioChunks.push(data.audio);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject({ statusCode: 500, body: "ElevenLabs WebSocket error." });
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed.');
        if (audioChunks.length > 0) {
          const fullAudioBase64 = audioChunks.join('');
          resolve({
            statusCode: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": Buffer.from(fullAudioBase64, 'base64').length,
            },
            body: fullAudioBase64,
            isBase64Encoded: true,
          });
        } else {
          resolve({ statusCode: 500, body: "No audio data received." });
        }
      };
    } catch (error) {
      console.error("Function execution error:", error);
      reject({ statusCode: 500, body: "Internal server error." });
    }
  });
};