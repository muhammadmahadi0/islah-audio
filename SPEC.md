# Islah Audio - Spotify Clone Specification

## Project Overview
- **Project Name**: Islah Audio
- **Type**: Web Application (Audio Streaming)
- **Core Functionality**: Fetch audio content from YouTube channel @islahbd via Piped API and stream as audio-only player
- **Target Users**: Users who want to listen to Islamic content from Islah BD channel

## Technical Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with custom Spotify-like theme
- **Icons**: Lucide React
- **UI Components**: Shadcn UI
- **State Management**: Zustand (global audio player state)
- **API**: Piped API (https://pipedapi.kavin.rocks)

## UI/UX Specification

### Color Palette (Spotify Dark Mode)
- **Background Primary**: #121212
- **Background Secondary**: #181818
- **Background Tertiary**: #282828
- **Surface Hover**: #3E3E3E
- **Accent Primary**: #1DB954 (Spotify Green)
- **Accent Hover**: #1ED760
- **Text Primary**: #FFFFFF
- **Text Secondary**: #B3B3B3
- **Text Muted**: #727272

### Typography
- **Font Family**: System default (sans-serif), Spotify uses circular font
- **Heading Large**: 32px, font-weight 700
- **Heading Medium**: 24px, font-weight 600
- **Body**: 14px, font-weight 400
- **Small**: 12px, font-weight 400

### Layout Structure
- **Sidebar Width**: 240px
- **Main Content**: Flexible (calc(100vw - 240px))
- **Player Bar Height**: 90px
- **Content Area**: calc(100vh - 90px)

### Components

#### Sidebar (Left - 240px)
- Logo/Brand at top
- Navigation items: Home, Search, Library
- Channel Playlists section
- Each nav item: Icon + Label
- Active state: White text, green accent bar on left

#### Main Content Area
- Header: Page title, user actions
- Content: Scrollable grid of video cards
- Grid: Auto-fill, min 180px per card, gap 24px

#### Video/Track Card
- Thumbnail: 180px height, rounded 8px
- Title: 14px, white, 2-line clamp
- Date: 12px, muted gray
- Play button overlay on hover

#### Bottom Player (90px height)
- **Left Section** (30%): Track info (Thumbnail 56px, Title, Artist)
- **Center Section** (40%): Controls
  - Buttons: Previous, Play/Pause, Next
  - Progress bar: Current time, seek bar, total duration
- **Right Section** (30%): Volume slider, extra controls

### Responsive Breakpoints
- **Desktop**: > 1024px (full layout)
- **Tablet**: 768px - 1024px (collapsible sidebar)
- **Mobile**: < 768px (bottom nav, no sidebar)

## Functionality Specification

### Core Features

1. **Channel Discovery**
   - Search for @islahbd channel via Piped search API
   - Fetch channel ID and metadata
   - Fetch latest videos from channel

2. **Video Grid Display**
   - Display video thumbnails (use YouTube thumbnail URLs)
   - Show video title and upload date
   - Click to play audio

3. **Audio Playback**
   - Fetch stream data via `/streams/{videoId}`
   - Extract audioStreams array (prefer highest quality audio)
   - Play using HTML5 Audio element
   - Global state via Zustand

4. **Player Controls**
   - Play/Pause toggle
   - Previous/Next track navigation
   - Seek bar (click to seek)
   - Volume control (slider)
   - Track progress display (current time / duration)

### API Endpoints (Piped)
- **Base URL**: https://pipedapi.kavin.rocks
- **Search**: `/suggestions?query=islahbd` or `/search?q=islahbd&filter=channels`
- **Channel Videos**: `/channel/{channelId}`
- **Streams**: `/streams/{videoId}`

### Data Handling
- Cache channel data in memory
- Store current playlist in Zustand
- Handle loading and error states gracefully

### Edge Cases
- No audio streams available: Show error message
- API timeout: Retry with exponential backoff
- Invalid video ID: Skip to next track
- Empty search results: Show "No results" message

## Acceptance Criteria

1. ✅ App loads and fetches @islahbd channel data
2. ✅ Video grid displays with thumbnails and titles
3. ✅ Clicking a video starts audio playback
4. ✅ Bottom player shows current track info
5. ✅ Play/Pause, Previous/Next controls work
6. ✅ Progress bar updates in real-time
7. ✅ Volume slider adjusts audio volume
8. ✅ Dark theme matches Spotify color palette
9. ✅ Sidebar navigation is visible and functional
10. ✅ Responsive layout works on different screen sizes