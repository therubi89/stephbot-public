// netlify/functions/speak.js

// Change this line:
// const fetch = require('node-fetch');

// To this dynamic import:
let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
})();

exports.handler = async function(event, context) {
  // Wait for fetch to be loaded before proceeding
  while (!fetch) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log("Function invoked.");

  if (event.httpMethod !== "POST") {
    console.warn("Method Not Allowed:", event.httpMethod);
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!ELEVENLABS_API_KEY) {
    console.error("ElevenLabs API Key is NOT set in Netlify environment variables. Check Site Settings -> Build & deploy -> Environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error: API key missing." }),
    };
  }

  try {
    const { text, voiceId, model_id, voice_settings } = JSON.parse(event.body);
    console.log("Received payload:", { text, voiceId });

    if (!voiceId) {
        console.error("Missing voiceId in request body.");
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing voiceId in request." }),
        };
    }

    console.log(`Calling ElevenLabs for voiceId: ${voiceId}`);
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        model_id: model_id || "eleven_monolingual_v1",
        voice_settings: voice_settings || { stability: 0.3, similarity_boost: 0.75 }
      })
    });
    console.log(`ElevenLabs response status: ${elevenLabsResponse.status}`);

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error(`ElevenLabs API returned an error: Status ${elevenLabsResponse.status}, Body: ${errorText}`);
      return {
        statusCode: elevenLabsResponse.status,
        body: JSON.stringify({ error: `ElevenLabs API error: ${errorText}` })
      };
    }

    console.log("ElevenLabs call successful, processing audio.");
    const audioBlob = await elevenLabsResponse.buffer();

    if (audioBlob.length === 0) {
        console.error("ElevenLabs returned an empty audio blob.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "ElevenLabs returned empty audio data." })
        };
    }
    console.log(`Audio blob size: ${audioBlob.length} bytes`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBlob.length,
      },
      body: audioBlob.toString('base64'),
      isBase64Encoded: true,
    };

  } catch (error) {
    console.error("UNHANDLED FUNCTION ERROR:", error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error." }),
    };
  }
};