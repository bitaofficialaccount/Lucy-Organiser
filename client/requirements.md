## Packages
simple-peer | WebRTC peer-to-peer connections for video calling
@types/simple-peer | TypeScript definitions for simple-peer
framer-motion | Tactile, heavy, "clicky" transitions between screens
date-fns | Date formatting and manipulation for calendar view

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["Space Mono", "monospace"],
  sans: ["Inter", "sans-serif"],
  oled: ["Fira Code", "monospace"],
}
WebSocket connects to /ws path for Simple-Peer signaling.
Session-based auth handles authentication automatically via cookies. Use /api/auth/me.
