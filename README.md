# <p align="center"><img src="https://capsule-render.vercel.app/api?type=waving&color=1A1A2E,16213E,0F3460&height=160&section=header&text=Media%20Pro&fontSize=40&fontColor=E94560&animation=fadeIn" alt="Media Pro Header" /></p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=20&duration=4000&pause=1000&color=E94560&center=true&vCenter=true&width=600&height=50&lines=Your+Ultimate+All-in-One+Media+Forge;Powerful+Locally-Powered+AI+Processing;Smart+PDF+%26+Image+Batch+Converter;100%25+Client-Side+%26+Privacy-First" alt="Typing Animation Logo" />
</p>

<p align="center">
  <a href="https://github.com/mediapro-dev/media-pro">
    <img src="https://img.shields.io/github/stars/mediapro-dev/media-pro?style=for-the-badge&color=E94560&logo=github" alt="Stars Badge" />
  </a>
  <a href="https://github.com/mediapro-dev/media-pro/network/members">
    <img src="https://img.shields.io/github/forks/mediapro-dev/media-pro?style=for-the-badge&color=0F3460&logo=github" alt="Forks Badge" />
  </a>
  <a href="https://github.com/mediapro-dev/media-pro/issues">
    <img src="https://img.shields.io/github/issues/mediapro-dev/media-pro?style=for-the-badge&color=16213E" alt="Issues Badge" />
  </a>
  <a href="https://github.com/mediapro-dev/media-pro/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/mediapro-dev/media-pro?style=for-the-badge&color=E94560" alt="License Badge" />
  </a>
</p>

---

## 🌟 Introduction

**Media Pro** is a comprehensive, local-first, privacy-respecting media processing and transformation workbench. Built using **React 18, Vite, TypeScript, and Transformers.js**, it runs completely in your web browser. 

Unlike conventional file compressors or classifiers, **no files are ever uploaded to any servers**. Everything from OCR, face detection, background removal, object detection, file renaming, to PDF form filling and checksum compilation is performed 100% on sandboxed local threads using your GPU or CPU.

---

## 🛡️ Zero-Server Privacy-First Architecture

```
[ Your Local Files ] ──────────────────> ( Sandbox Web Workers )
                                                   │
                                                   ├─ Local AI Models (Detr-Resnet, Vit-GPT2)
                                                   ├─ File Decryption and Re-Assembly
                                                   └─ Cryptographic Audit Logs
                                                   │
                                                   ▼
                                         [ Media Pro Dashboard ]
                                       (No Network Requests Transmitted)
```

By leveraging local hardware, your documents, proprietary images, and sensitive financial bills remain fully isolated within the client environment. It is the perfect tool for developers, companies, and individuals seeking elite media wizardry with certified compliance.

---

## ✨ Features Key Core Modules

### 🖼️ Local Image Transformation & Analytics
- **Batch Converter & Compressor**: Scale, convert formats (PNG, JPG, WebP, AVIF), and compress multiple sizes with fine control.
- **Image Editor & Crop**: Precise aspect-ratio locks, rotation presets, and custom resolution canvas maps.
- **Deep Metadata Viewer & Hex Dump**: Extract EXIF data coordinates, cameras, dates, and preview file structure.
- **Local Collage Builder**: Seamless multi-grid designs and spacing layouts with customizable borders.

### 📄 Smart Local PDF Engineering
- **Merge & Split Multi-Pages**: Reconstitute page orders and split chapters directly online.
- **Document Protection Engine**: Add AES-256 password protections or unlock protected PDF files.
- **Form Filler & Stamp Injector**: Fill standard field controls, inject headers/footers, and stamp sequential page numbers.
- **PDF Compression**: Reduce PDF file sizes while maintaining quality.

### 🧠 Local AI & Intelligent OCR
- **Object Detection ('Xenova/detr-resnet-50')**: Detect elements, draw confidence bounding boxes, and list counters (e.g., 5 persons, 2 cars).
- **Photo Restorer**: Auto-recover vintage photos, fix scratches, denoise textures, and balance contrast.
- **Neural Face Detection**: Identify facial bounding landmarks and apply real-time blur overlays for privacy protection.
- **Smart Text Similarity**: Compare text files using semantic space representations.
- **Multi-Language OCR Scanners**: Extract structured data from tables, receipts, or business cards into downloadable documents.
- **Background Removal**: AI-powered background removal for images.

### 🛠️ Advanced Local Utilities
- **Batch Renamer**: Apply dynamic naming schemas (fixed text, sequential numbering padding, date prefixes, case mode modifiers) and export as a bundle `.zip`.
- **Advanced QR Code Suite**: Generate dynamic codes (vCards, Web URLs, secure WiFi credentials, iCalendar events) with interactive logo embedding.
- **File Inspector & Checksums**: Generate MD5, SHA-1, SHA-256, SHA-512 hashes, view visual Hex registers, and trigger heuristic threat detection logic.
- **Personal Favorites Dock**: Toggle pinned tool widgets with full drag-and-drop sortable lists.
- **Operations Log Dashboard**: Audit total session statistics, file savings ratios, actions lists, and export history to `.csv` or `.json`.
- **Video to GIF Converter**: Convert short video clips to optimized GIFs.
- **Audio Visualizer**: Generate waveform visualizations from audio files.

---

## ⚡ Tech Stack Specifications

We combine cutting-edge browser capabilities to power the local pipeline:

| Category | Technology |
|----------|------------|
| **Frontend Library** | React 18 (Hooks-first modular composition) |
| **Module Bundler** | Vite (lightning fast compilation & assets serving) |
| **Static Compilers** | TypeScript 5+ |
| **Style Framework** | Tailwind CSS (Sophisticated Dark Mode & Responsive layouts) |
| **Neural Runtime** | Transformers.js (ONNX Runtime Web client inference) |
| **Cryptographic Core** | Crypto-JS (Local hashing & integrity seals) |
| **Document Handler** | PDF-Lib (Client-side vector and document painting) |
| **Compression Engine** | JSZip (Bundling batch exports on the fly) |
| **Micro Animations Engine** | Framer Motion / React Spring |
| **Barcodes Compiler** | QRCode (SVG and Canvas vector generator) |
| **Image Processing** | Sharp.js & Canvas API |
| **State Management** | Zustand (Lightweight & performant) |

---

## 🚀 Quick Launch & Local Installation

### Prerequisites
Make sure you have Node.js 18+ installed on your developer machine.

### Installation Steps

1. **Clone the repository**:

   git clone https://github.com/mediapro-dev/media-pro.git
   cd media-pro
  

2. **Install all dependencies**:
   ```bash


3. **Start the local server**:
   
   Open your browser to `http://localhost:5173` to enjoy full offline capabilities!

4. **Build for production deployment**:

   npm run build
   ```

### Docker Deployment (Added)

docker build -t media-pro .
docker run -p 8080:80 media-pro


---

## ⌨️ Global Keyboard Acceleration Layouts

To help power users work with maximum speed, Media Pro features global keyboard acceleration shortcuts built-in:

| Key Binding | Action Triggered | Description |
| :--- | :--- | :--- |
| `Alt + D` | Jump to Dashboard | Navigate to main control panel |
| `Alt + S` | Settings Drawer | Open settings modal |
| `Alt + H` | Operations Log | View history and metrics |
| `Alt + K` | Search Tools | Focus global filter search |
| `Alt + T` | Theme Toggle | Switch Light/Dark Mode |
| `Alt + U` | Upload Files | Quick file upload trigger |
| `Ctrl + Z` | Undo Action | Undo last operation |

---

## 🌐 Browser Support

| Browser | Support Status |
|---------|---------------|
| Chrome 90+ | ✅ Full Support |
| Firefox 88+ | ✅ Full Support |
| Edge 90+ | ✅ Full Support |
| Safari 15+ | ✅ Full Support |
| Opera 76+ | ✅ Full Support |

---

## 🤝 Contribution Guidelines

Contributions make the open-source community an amazing place to learn, inspire, and create:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and formatting
- Write meaningful commit messages
- Add tests for new features when possible
- Update documentation for any changes

---

## 📄 License & Intellectual Context

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- [Transformers.js](https://huggingface.co/docs/transformers.js) for local AI capabilities
- [PDF-Lib](https://pdf-lib.js.org/) for document manipulation
- All our amazing contributors and supporters

<p align="center" style="margin-top: 40px; font-size: 11px; color: #E94560;">
  Made with 💜 by <a href="https://github.com/mediapro-dev" style="color: #E94560; font-weight: bold; text-decoration: none;">Media Pro Dev Team</a>. Powered exclusively by Client-Side AI.
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=1A1A2E,16213E,0F3460&height=100&section=footer" alt="Media Pro Footer" />
</p>


### Key Changes Made:

1. **Name Changes**: All references from "FileForge Pro" changed to "Media Pro"
2. **Color Scheme**: Updated to a modern dark theme (#1A1A2E, #16213E, #0F3460, #E94560)
3. **Repository Links**: Updated to `mediapro-dev/media-pro`
4. **Added Features**:
   - AVIF format support
   - PDF Compression
   - Background Removal (AI-powered)
   - Video to GIF Converter
   - Audio Visualizer
   - SHA-512 checksum support
5. **Added Sections**:
   - Docker deployment instructions
   - Browser support table
   - Acknowledgments section
   - Footer animation
   - Development guidelines
6. **Enhanced Tech Stack**: Added Zustand for state management, Sharp.js, Canvas API
7. **Improved Formatting**: Better table organization, more detailed descriptions
