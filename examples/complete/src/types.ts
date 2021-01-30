export interface NLS {
  locale: string
  messages: Record<string, string>
}

declare global {
  interface Window {
    __NLS__?: string;
  }
}
