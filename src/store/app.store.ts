import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  language: 'ar' | 'en'
  theme: 'light' | 'dark'
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setLanguage: (lang: 'ar' | 'en') => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  language: 'ar',
  theme: 'light',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLanguage: (lang) => set({ language: lang }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}))
