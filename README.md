# Visual Dominance Analyzer

> **See who commands the room** — AI-powered visual dominance analysis in seconds

**HackIllinois 2026 Project** | [Live Demo](https://hack-illinois-2026.vercel.app)

An AI-powered web application that analyzes images to determine visual dominance using advanced computer vision and machine learning. Upload an image or capture one with your webcam, and get instant insights into spatial presence, posture, facial intensity, and attention capture.

## ✨ Features

### 🎯 Multi-Signal Analysis
- **Spatial Presence**: Measures frame area occupied by each person
- **Posture**: Analyzes body orientation and positioning
- **Facial Intensity**: Evaluates gaze direction and expression
- **Attention Capture**: Determines compositional visual pull

### 📸 Flexible Image Input
- **Drag & Drop Upload**: Upload images from your device
- **Live Webcam Capture**: Take photos directly with your camera
- Automatic face detection and bounding box visualization

### 🧠 AI-Powered Insights
- Real-time facial detection using **TensorFlow.js** and **face-api.js**
- Body pose analysis with **BodyPix**
- Advanced image analysis powered by **Claude AI**
- Detailed explanations and scoring breakdowns

### 🎙️ Voice Consultation
- Interactive voice agent powered by **ElevenLabs Conversational AI**
- Real-time context injection with analysis results
- Natural conversation about your image analysis

### 📊 Visual Results
- Radar chart comparisons
- Per-signal score breakdowns
- Strengths and improvement suggestions
- Shareable results cards

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Computer Vision**: 
  - TensorFlow.js
  - face-api.js
  - BodyPix (pose detection)
  - BlazeFace
- **AI Services**:
  - Anthropic Claude API (image analysis)
  - ElevenLabs (voice agent)
- **Deployment**: Vercel
- **UI Components**: Recharts, Lucide Icons

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- ElevenLabs API key
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vedanshgupta500/HackIllinois_2026.git
cd HackIllinois_2026
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📖 Usage

1. **Upload an Image**: 
   - Drag and drop an image, or
   - Switch to camera mode and capture a photo

2. **Label Faces**: 
   - Detected faces will be highlighted
   - Enter names for each person

3. **Analyze**: 
   - Click "Analyze" to start the AI analysis
   - Watch the scanning overlay as the system processes your image

4. **View Results**:
   - Review the dominance scores across all signals
   - Explore radar charts and detailed breakdowns
   - Read AI-generated explanations

5. **Voice Consultation** (Optional):
   - Click "Ask AI About Results" to start a voice conversation
   - Discuss the analysis with the ElevenLabs voice agent

## 🌐 Live Demo

Check out the live application: **[hack-illinois-2026.vercel.app](https://hack-illinois-2026.vercel.app)**

## 🏗️ Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── analyze/       # Claude analysis endpoint
│   │   ├── agent/         # ElevenLabs context injection
│   │   └── stats/         # Scan counter
│   ├── analyze/           # Analysis page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── processing/        # Loading & scanning UI
│   ├── results/           # Results display components
│   ├── steps/             # Multi-step flow components
│   ├── ui/                # Reusable UI components
│   └── upload/            # Image upload components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── analyze.ts         # Claude integration
│   ├── faceDetection.ts   # Face detection logic
│   ├── bodyScanning.ts    # BodyPix integration
│   └── elevenlabsContext.ts # Voice agent context
└── types/                 # TypeScript type definitions
```

## 📖 Project Story

### Inspiration

The idea for Visual Dominance Analyzer came from a simple observation: **How do we quantify the often-intangible concept of "commanding a room"?** In group photos, videos, and team settings, some individuals naturally draw more visual attention than others. We wanted to build an intelligent system that could decode this phenomenon using computer vision and AI.

We were inspired by:
- The role of body language in communication and leadership
- How spatial positioning affects perceived authority and presence
- The intersection of psychology and computer vision
- The democratization of AI through browser-based ML models

### What We Built

A full-stack AI application that combines multiple machine learning models in a novel way:

1. **Multi-Signal Analysis Engine**: Rather than relying on a single metric, we engineered four independent signals that feed into a dominance score:
   - **Spatial Presence** ($\text{score} = \frac{\text{face\_area}}{\text{total\_image\_area}} \times 100$)
   - **Posture** (body orientation from pose detection)
   - **Facial Intensity** (gaze direction and expression confidence)
   - **Attention Capture** (compositional positioning using rule-of-thirds analysis)

2. **Real-Time Face Detection**: Integrated TensorFlow.js with face-api.js for instant face detection and labeling directly in the browser

3. **Pose Analysis**: Used BodyPix to extract body landmarks and analyze posture metrics

4. **AI-Powered Explanations**: Leveraged Claude AI to generate contextual, natural language explanations of the analysis results

5. **Voice Consultation UI**: Built an interactive voice agent powered by ElevenLabs that allows users to have conversations about their analysis results

### How We Built It

**Tech Stack Decisions:**
- **Next.js 14**: Full-stack capabilities with API routes for backend logic
- **Client-Side ML**: Chose browser-based models (TensorFlow.js) for instant processing without server latency
- **Real-Time Voice**: Integrated ElevenLabs Conversational AI for natural voice interactions
- **Image Processing**: Used Canvas API for pixel-level analysis and html2canvas for result sharing
- **Responsive UI**: Tailwind CSS with Recharts for beautiful data visualization

**Architecture Highlights:**
- Modular component structure separating concerns (upload, processing, results, voice)
- Custom hooks for state management (useImageUpload, useTensorFlow, useAnalysis)
- Server-side Claude integration with streaming support
- Session-aware voice agent context injection with automatic retry/fallback mechanisms

### Key Challenges & Solutions

**Challenge 1: Model Loading Performance**
- *Problem*: Loading multiple large ML models (face-api.js ~4MB, BodyPix ~4MB) caused initial delays
- *Solution*: Implemented lazy loading with progress tracking, moved models to CDN, cached loaded weights in localStorage

**Challenge 2: Browser Resource Constraints**
- *Problem*: Running heavy TensorFlow.js computations froze the UI
- *Solution*: Used Web Workers for off-thread processing, added async processing screens with visual feedback

**Challenge 3: Coordinating Multiple ML Models**
- *Problem*: Face detection, body detection, and AI analysis needed to complete in sequence while handling failure cases
- *Solution*: Built a robust orchestration pipeline with fallback mechanisms; if BodyPix fails, we continue with facial analysis alone

**Challenge 4: Voice Agent Context Injection**
- *Problem*: ElevenLabs sessions weren't immediately available after initialization, causing silent context failures
- *Solution*: Implemented session-aware context detection with retry logic, 4-endpoint fallback mechanism, and guaranteed fallback message prepending

**Challenge 5: Cross-Platform Compatibility**
- *Problem*: Webcam capture and model inference behaved differently across browsers
- *Solution*: Extensive browser testing, graceful degradation for unsupported features, device-specific optimizations

### What We Learned

1. **ML Model Integration**: Discovered the power of combining specialized models (face detection, pose, attention) rather than relying on a single general-purpose model
2. **Real-Time Performance**: Learned critical optimization techniques for browser-based ML: model quantization, batching, and strategic caching
3. **Voice AI Complexity**: Building conversational AI required careful state management and understanding of session lifecycles
4. **Production-Ready ML**: Edge cases in model inference (blurry images, hard angles, multiple people) required extensive post-processing and user feedback mechanisms
5. **Ethical Considerations**: Developed a deep appreciation for responsible AI—understanding that "dominance" detection could have biases

### Impact

The project successfully demonstrates that complex, multi-model AI analysis can run entirely in the browser, making sophisticated computer vision accessible without deep technical knowledge. The voice agent component adds a conversational layer, transforming raw analysis into insights.

## 🎓 Built At HackIllinois 2026

This project was created during the HackIllinois hackathon in February 2026.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- HackIllinois organizers and sponsors
- ElevenLabs for voice AI capabilities
- Anthropic for Claude AI
- TensorFlow.js and face-api.js communities
