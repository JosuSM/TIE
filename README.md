# TIE — The Interconnected Emulator 🎮🚀

**TIE** (The Interconnected Emulator) is a professional-grade, browser-based emulation frontend designed for the modern retro gamer. Built with React and powered by **Nostalgist.js** (Libretro WASM cores), TIE offers a seamless, high-performance gaming experience directly in your browser with no installation required.

![TIE Preview](https://raw.githubusercontent.com/JosuSM/TIE/main/src/assets/preview.png)

## 🌟 Key Features

### 🌐 Real-Time Netplay (P2P)
Play with friends across the globe using low-latency Peer-to-Peer connections. TIE leverages **WebRTC** via PeerJS to sync inputs between up to 4 players.

### 📚 Advanced Library Scanner
TIE features a robust local directory scanner that automatically organizes your ROMs. 
- **Auto-Detection**: Recognizes 20+ retro systems.
- **Box Art Integration**: Automatically fetches high-quality box art from libretro-thumbnails.
- **Lazy Rendering**: High-performance scrolling for catalogs with thousands of games.

### 💾 10 Persistent Save State Slots
Never lose progress again. TIE provides 10 dedicated save slots backed by **IndexedDB**, allowing you to persist your state across browser sessions with ease.

### 🖥️ CRT & Display Filters
Relive the golden era with multiple professional display modes:
- **CRT Scanlines**: Classic horizontal lines.
- **Phosphor Glow**: Cinematic vignette and phosphor effect.
- **Full Curvature**: Authentic CRT bulge and corner rounding.
- **LCD Grid**: Handheld style pixel grid for GB/GBA.

### 🎮 Custom Controls & Input
- **Per-System Mapping**: Remap keys specifically for each console (NES, SNES, GBA, etc.).
- **Gamepad Support**: Plug-and-play support for standard USB/Bluetooth controllers.
- **Touch Layer**: Intelligent on-screen controls for mobile and tablet play.
- **Haptic Feedback**: Vibration support for immersive feedback.

### ⚡ Performance & Utility
- **Fast Forward**: Speed through slow sections with a single click.
- **Screenshot Capture**: Save your favorite gaming moments as PNGs.
- **4 Color Themes**: Personalize the UI with Neon Pink, Retro Green, Classic Blue, or Purple Haze.
- **PWA Support**: Install TIE as a desktop or mobile app for offline access.

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Emulation Engine**: [Nostalgist.js](https://nostalgist.js.org/) (Libretro WASM)
- **Netplay**: [PeerJS](https://peerjs.com/) (WebRTC)
- **Persistence**: IndexedDB (via idb-keyval)
- **Audio Control**: Web Audio API
- **Styling**: Vanilla CSS (Modern Design System)

## 🚀 Quick Start

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/JosuSM/TIE.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Hardware Requirements
- **Browser**: Any modern browser with WebAssembly support (Chrome, Firefox, Safari, Edge).
- **GPU**: Hardware acceleration enabled recommended for CRT shaders.

## 📜 Credits

- **Developer**: [JosuSM](https://github.com/JosuSM)
- **Emulation Core**: Powered by [Nostalgist.js](https://nostalgist.js.org/) and the incredible [Libretro](https://www.libretro.com/) community.
- **Thumbnails**: Box art provided by [libretro-thumbnails](https://github.com/libretro-thumbnails).

---
*Made with ❤️ for the retro gaming community.*
