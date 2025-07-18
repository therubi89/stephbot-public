// netlify/functions/speak.js
const fetch = require('node-fetch'); // Netlify Functions include node-fetch

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

  try {
    const { text, voiceId, model_id, voice_settings } = JSON.parse(event.body);

    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        model_id: model_id || "eleven_monolingual_v1", // Use default if not provided
        voice_settings: voice_settings || { stability: 0.3, similarity_boost: 0.75 } // Use default if not provided
      })
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("ElevenLabs API response error:", elevenLabsResponse.status, errorText);
      return {
        statusCode: elevenLabsResponse.status,
        body: JSON.stringify({ error: `ElevenLabs API error: ${errorText}` })
      };
    }

    // Return the audio blob directly from the function
    const audioBlob = await elevenLabsResponse.buffer(); // Use .buffer() for binary data

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBlob.length, // Important for streaming audio
      },
      body: audioBlob.toString('base64'), // Send as base64
      isBase64Encoded: true, // Tell Netlify it's base64 encoded binary data
    };

  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error." }),
    };
  }
};