# Blade Command Center MVP

Goal: Build a small command center app that lets Dr. Blade manage projects/tasks and talk back-and-forth with the assistant using voice.

## Core MVP
- Web app dashboard / command center
- Project/task sidebar and workspace view
- Voice input in browser (use browser-native speech recognition/Web Speech API fallback for MVP)
- Voice output using Cartesia TTS via server-side API proxy
- Text chat + voice chat in the same interface
- Session/task context panel for active workstreams
- Basic persistence for chats, projects, and tasks

## Product constraints
- Must be runnable locally
- Must be easy to extend later into a richer operations dashboard
- Prefer pragmatic stack (Next.js + TypeScript + SQLite/local persistence)
- Cartesia API key should be read from env

## MVP pages/features
1. Command center main page with:
   - active projects list
   - current tasks
   - conversation pane
   - microphone button
   - speak-back toggle
2. Projects page
3. Tasks page
4. Settings page for voice config and API checks

## Voice requirements
- Browser speech recognition for MVP input if available
- Cartesia TTS for assistant responses
- Backend route that takes text and returns audio / playable response
- clean interface for future STT provider swap

## Deliverables
- working app scaffold
- voice UI components
- Cartesia TTS integration
- local persistence for projects/tasks/chat history
- README with setup instructions
