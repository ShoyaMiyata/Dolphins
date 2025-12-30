import { create } from 'zustand'

interface CreatePostDialogState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useCreatePostDialog = create<CreatePostDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
