# Delvo - Conversational AI Research Assistant

> **Autonomous AI Research Platform with Real-Time Web Grounding & Live Streaming**

Delvo is an intelligent autonomous AI research assistant that decomposes complex investigative questions, executes real-time web navigation and empirical fact extraction, and synthesizes structured, cited research reports over low-latency bidirectional WebSockets.

---

## 🌟 Key Features

- **Autonomous Agentic Reasoning**: Built with LangChain & Mistral AI (`codestral-latest` / `mistral-medium`) with dynamic tool-calling heuristics.
- **Real-Time Web Grounding**: Integrated Tavily Search API that automatically retrieves and cites current web sources when required by the query.
- **Live Bidirectional WebSockets**: Token-by-token streaming, live thinking pulses, and real-time citation assembly via Socket.IO.
- **Enterprise Authentication**:
  - Email & Password with BCrypt salted hashing ($\ge 10$ rounds)
  - Biometric Hardware Passkeys (WebAuthn / FIDO2)
  - Enterprise SAML 2.0 Single Sign-On (Okta, Azure AD, Google Workspace)
  - Third-party OAuth 2.0 (Google, GitHub, Apple, OpenAI ChatGPT, GitLab, Bitbucket)
- **Apple-Grade Design System**:
  - SF Pro / Inter typography stack with OpenType feature settings
  - Kinetic smooth scrolling with reading progress bars and floating back-to-top controls
  - Pure dark mode (`#000000`) and light mode (`#FFFFFF`)
- **Comprehensive Legal Documentation**:
  - [Terms of Service](client/src/pages/Terms.jsx) with sticky TOC sidebar
  - [Privacy Policy](client/src/pages/Privacy.jsx) with strict **Zero-Data-Training guarantees**

---

## 📐 Architecture & System Maps

For full architectural blueprints, visual system topology maps, entity relationship diagrams, and WebSocket sequence flows, see **[ARCHITECTURE.md](ARCHITECTURE.md)**:

- **System Topology & Network Map**: Port bindings, protocol layers, and external cloud API boundaries.
- **Codebase Directory & File Map**: Complete annotated repository tree.
- **API, Route & Event Map**: Client routes, REST endpoints, and Socket.IO events.
- **Data Flow Journey Map**: Prompt-to-citation data pipeline.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Lucide Icons, Socket.IO Client, Vanilla CSS Design System |
| **Backend** | Node.js, Express.js, Socket.IO, JWT, CORS |
| **AI / Agentic** | LangChain, `@langchain/mistralai`, Tavily Search API |
| **Database** | MongoDB, Mongoose ODM |
| **Security** | BCrypt, JWT Bearer Auth, TLS 1.3, AES-256 |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally on `mongodb://localhost:27017` or a MongoDB Atlas URI
- API keys for:
  - **Mistral AI**: `MISTRAL_API_KEY` ([console.mistral.ai](https://console.mistral.ai/))
  - **Tavily Search**: `TAVILY_API_KEY` ([tavily.com](https://tavily.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/Basit0012/Delvo-Conversational-AI-Research-Assistant.git
cd Delvo-Conversational-AI-Research-Assistant
```

### 2. Configure Environment Variables

**Server (`server/.env`)**:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/delvo
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Mistral AI
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_MODEL=codestral-latest

# Tavily Search API
TAVILY_API_KEY=your_tavily_api_key_here
```

**Client (`client/.env`)**:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Run Locally

```bash
# Start backend server (from server directory)
cd server
npm run dev

# Start frontend dev server (from client directory in a separate terminal)
cd client
npm run dev
```

- Frontend runs at: `http://localhost:5173`
- Backend API runs at: `http://localhost:5000`

---

## 🧪 Testing & Verification

```bash
# Run server test suites
cd server
npm test

# Build client production bundle
cd ../client
npm run build
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
