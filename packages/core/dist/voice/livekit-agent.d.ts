export interface VoiceConfig {
    livekitUrl: string;
    apiKey: string;
    apiSecret: string;
    roomName?: string;
}
export interface VoiceRoomResult {
    roomName: string;
    token: string;
}
/**
 * Creates a LiveKit room and generates a participant token.
 * The room is created implicitly when the first participant joins.
 */
export declare function createVoiceRoom(config: VoiceConfig): Promise<VoiceRoomResult>;
/**
 * Generates a JWT token for a participant to join a LiveKit room.
 */
export declare function generateParticipantToken(config: VoiceConfig, roomName: string, participantName: string): Promise<string>;
//# sourceMappingURL=livekit-agent.d.ts.map