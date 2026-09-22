import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CHANNEL_ID, getChannelById } from '@/lib/channels';

interface ChannelState {
  channelId: string;
  setChannelId: (id: string) => void;
}

export const useChannelStore = create<ChannelState>()(
  persist(
    (set) => ({
      channelId: DEFAULT_CHANNEL_ID,
      // Views subscribe to channelId and refetch when it changes.
      setChannelId: (channelId) => set({ channelId: getChannelById(channelId).id }),
    }),
    { name: 'islah-channel' }
  )
);
