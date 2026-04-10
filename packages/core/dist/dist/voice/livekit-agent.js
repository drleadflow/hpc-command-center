import { AccessToken } from 'livekit-server-sdk';
import crypto from 'node:crypto';
/**
 * Creates a LiveKit room and generates a participant token.
 * The room is created implicitly when the first participant joins.
 */
export async function createVoiceRoom(config) {
    const roomName = config.roomName ?? `blade-room-${crypto.randomUUID().slice(0, 8)}`;
    const participantName = `blade-agent-${crypto.randomUUID().slice(0, 6)}`;
    const token = await generateParticipantToken(config, roomName, participantName);
    return { roomName, token };
}
/**
 * Generates a JWT token for a participant to join a LiveKit room.
 */
export async function generateParticipantToken(config, roomName, participantName) {
    const at = new AccessToken(config.apiKey, config.apiSecret, {
        identity: participantName,
        name: participantName,
    });
    at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
    });
    return await at.toJwt();
}
//# sourceMappingURL=livekit-agent.js.map