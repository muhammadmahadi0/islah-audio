/**
 * Live broadcast integration (islahbd.com).
 *
 * Status + recording metadata come from their public status API.
 * The live HLS stream plays in-app via hls.js; see AudioPlayer.
 */

export interface LiveRecording {
  title: string;
  speaker: string;
  audioUrl: string;
  durationSeconds: number;
}

export interface LiveStatus {
  isLive: boolean;
  title: string;
  speaker: string;
  listeners: number;
  /** HLS manifest URL — only meaningful when isLive. */
  streamUrl: string;
  recording: LiveRecording | null;
}

export const LIVE_POLL_MS = 60_000;
