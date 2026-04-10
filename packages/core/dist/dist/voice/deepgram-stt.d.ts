/**
 * Deepgram Speech-to-Text integration.
 *
 * Transcribes audio buffers using the Deepgram Nova-2 model.
 */
export interface SpeechToTextOptions {
    language?: string;
    model?: string;
}
export declare function speechToText(audioBuffer: Buffer, options?: SpeechToTextOptions): Promise<string>;
//# sourceMappingURL=deepgram-stt.d.ts.map