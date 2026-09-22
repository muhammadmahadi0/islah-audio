/**
 * Channel registry — the app supports switching between these channels.
 * IDs verified via YouTube Data API (channels.forHandle).
 */

export interface AppChannel {
  id: string;
  handle: string;
  name: string;
}

export const CHANNELS: AppChannel[] = [
  { id: 'UC8NjCrYUV5YrpK2j6XTwGSA', handle: '@islahbd', name: 'Islah' },
  { id: 'UCZVVdlwGUDNwLF0Dqr9Klew', handle: '@IslahiGhazal', name: 'Islahi Ghazal' },
];

export const DEFAULT_CHANNEL_ID = CHANNELS[0].id;

export function getChannelById(id: string): AppChannel {
  return CHANNELS.find((c) => c.id === id) || CHANNELS[0];
}
