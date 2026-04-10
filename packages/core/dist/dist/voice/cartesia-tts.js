/**
 * Cartesia Text-to-Speech integration.
 *
 * Converts text to audio using the Cartesia Sonic-2 model.
 */
const DEFAULT_VOICE_ID = 'a0e99841-438c-4a64-b679-ae501e7d6091';
export async function textToSpeech(text, options) {
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
        throw new Error('Missing CARTESIA_API_KEY environment variable');
    }
    const voiceId = options?.voiceId ?? DEFAULT_VOICE_ID;
    const format = options?.outputFormat ?? 'mp3';
    const sampleRate = format === 'wav' ? 44100 : 44100;
    const body = {
        transcript: text,
        model_id: 'sonic-2',
        voice: {
            mode: 'id',
            id: voiceId,
        },
        output_format: {
            container: format,
            sample_rate: sampleRate,
            encoding: format === 'wav' ? 'pcm_f32le' : 'mp3',
        },
        ...(options?.speed != null ? { speed: options.speed } : {}),
    };
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
            'X-API-Key': apiKey,
            'Cartesia-Version': '2024-06-10',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cartesia TTS failed with ${response.status}: ${errorText.slice(0, 300)}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
//# sourceMappingURL=cartesia-tts.js.map