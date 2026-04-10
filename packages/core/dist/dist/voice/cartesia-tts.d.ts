/**
 * Cartesia Text-to-Speech integration.
 *
 * Converts text to audio using the Cartesia Sonic-2 model.
 */
export interface TextToSpeechOptions {
    voiceId?: string;
    speed?: number;
    outputFormat?: 'mp3' | 'wav';
}
export declare function textToSpeech(text: string, options?: TextToSpeechOptions): Promise<Buffer>;
//# sourceMappingURL=cartesia-tts.d.ts.map