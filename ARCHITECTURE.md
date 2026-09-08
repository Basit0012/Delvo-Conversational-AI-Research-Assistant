# Delvo Platform Architecture & System Maps

> **Autonomous AI Research Assistant with Real-Time Web Grounding & Live Streaming**

---

## Architecture Navigation & Map Index

- [1. System Topology & Network Map](#1-system-topology--network-map) — *Ports, hosts, protocols, and service connections*
- [2. Codebase Directory & File Map](#2-codebase-directory--file-map) — *Complete repository directory tree with file roles*
- [3. API, Route & Event Map](#3-api-route--event-map) — *Frontend routes, REST endpoints, and WebSocket channels*
- [4. Data Flow Journey Map](#4-data-flow-journey-map) — *Step-by-step lifecycle of an autonomous research query*
- [5. Autonomous Agent Decision Matrix](#5-autonomous-agent-decision-matrix) — *LangChain dynamic routing & web grounding heuristic*
- [6. Real-Time WebSocket & Agent Lifecycle](#6-real-time-websocket--agent-lifecycle) — *Bidirectional streaming sequence diagram*
- [7. Database Schema & Entity Relationship Map](#7-database-schema--entity-relationship-map) — *MongoDB collections and relational keys*
- [8. Frontend Component & Context Hierarchy](#8-frontend-component--context-hierarchy) — *React component tree and state providers*
- [9. Security, Authentication & Zero-Training Model](#9-security-authentication--zero-training-model) — *Zero-trust governance & privacy model*

---

## 1. System Topology & Network Map

The **System Topology Map** visualizes the physical, network, and service boundaries of the Delvo platform, including port bindings, communication protocols, and external APIs.

```mermaid
graph TB
    subgraph UserEnvironment["User Client Environment"]
        Browser["User Web Browser (Chrome / Safari / Edge / Firefox)"]
        LocalStorage[("Browser LocalStorage\n• JWT Token\n• Theme: dark/light")]
    end

    subgraph FrontendHost["Frontend Host (localhost:5173)"]
        ViteDev["Vite Dev / Static Server\nport: 5173 (TCP)"]
        ReactApp["React 18 Single Page App\n• React Router v6\n• Apple SF Pro Typography\n• Kinetic Smooth Scroll"]
    end

    subgraph BackendHost["Backend Application Host (localhost:5000)"]
        ExpressServer["Express.js Server\nport: 5000 (HTTP / TLS 1.3)"]
        SocketServer["Socket.IO WebSocket Server\npath: /socket.io (WSS)"]
        AuthMiddleware["JWT Authentication Guard\n• REST Bearer Auth\n• Socket.IO Handshake Auth"]
        AgentEngine["LangChain Agent Core\n• Multi-Turn Memory Loader\n• Tool Calling Controller"]
    end

    subgraph DatabaseHost["Database Tier (localhost:27017)"]
        MongoDB[("MongoDB Daemon\nmongodb://localhost:27017/delvo\n• Users Collection\n• Chats Collection\n• Messages Collection")]
    end

    subgraph ExternalCloud["External Cloud Intelligence APIs (HTTPS:443)"]
        MistralAPI["Mistral AI API\nhttps://api.mistral.ai/v1/chat/completions\nModel: codestral-latest / mistral-medium"]
        TavilyAPI["Tavily Search API\nhttps://api.tavily.com/search\nReal-Time Web Retrieval & Snippets"]
    end

    Browser -->|HTTP GET :5173| ViteDev
    ViteDev -->|Delivers HTML/JS/CSS| ReactApp
    ReactApp <-->|Read / Write Auth & Theme| LocalStorage

    ReactApp -->|REST API (JSON / Bearer Token)\nhttp://localhost:5000/api/*| ExpressServer
    ReactApp <-->|Bidirectional WebSockets\nws://localhost:5000/socket.io| SocketServer

    ExpressServer --> AuthMiddleware
    SocketServer --> AuthMiddleware
    AuthMiddleware -->|Mongoose ODM| MongoDB

    SocketServer -->|Dispatches Research Task| AgentEngine
    AgentEngine -->|Loads 10-turn Chat History| MongoDB
    AgentEngine -->|1. Reason & Route Prompt| MistralAPI
    AgentEngine -->|2. If web facts needed: Tool Call| TavilyAPI
    TavilyAPI -->|3. Return Title, URL, Snippet| AgentEngine
    AgentEngine -->|4. Synthesize Final Grounded Report| MistralAPI

    AgentEngine -->|5. Store User & Assistant Messages| MongoDB
    SocketServer -->|6. Stream Token-by-Token / Response| ReactApp
```

---

## 2. Codebase Directory & File Map

The **Codebase Map** details the physical location, responsibility, and dependencies of every module across the repository.

```
Delvo/
├── ARCHITECTURE.md                 # System architecture, topology, sequence & component maps
├── .gitignore                      # Git root exclusion rules
│
├── client/                         # FRONTEND APPLICATION (React 18 + Vite)
│   ├── index.html                  # HTML entry point, SEO tags, Apple viewport settings
│   ├── package.json                # Dependencies: react, react-router-dom, socket.io-client, lucide-react
│   ├── vite.config.js              # Vite bundler configuration & local dev proxy
│   └── src/
│       ├── main.jsx                # React root mount point (renders <App /> into #root)
│       ├── App.jsx                 # Route dispatcher & global Context Provider nesting
│       ├── index.css               # Apple-grade design system, tokens, typography & smooth scroll
│       ├── api/
│       │   └── client.js           # Fetch wrapper with JWT headers, error handling & base URL
│       ├── assets/                 # Icons, logos, and illustration media assets
│       ├── components/             # Reusable UI Components
│       │   ├── AuthBrandPanel.jsx  # Left branding showcase panel on Login/Register
│       │   ├── ChatWindow.jsx      # Message scroll area, chat input bar, and socket listeners
│       │   ├── DelvoLogo.jsx       # SVG wordmark and geometric triangle glyph
│       │   ├── MessageBubble.jsx   # Message renderer, markdown syntax, search pill & citations
│       │   ├── ProtectedRoute.jsx  # Route guard redirecting unauthenticated users to /login
│       │   ├── Sidebar.jsx         # Chat history drawer, session switcher & new chat action
│       │   └── ThemeToggle.jsx     # Smooth icon-based Dark Mode / Light Mode switcher
│       ├── context/                # Global React State Stores
│       │   ├── AuthContext.jsx     # User state, JWT store, login, register, social logins, logout
│       │   ├── SocketContext.jsx   # Active Socket.IO connection, room tracking & reconnect logic
│       │   ├── ThemeContext.jsx    # Dark/light theme persistence in localStorage & HTML attribute
│       │   ├── useAuth.js          # Custom consumer hook for AuthContext
│       │   └── useSocket.js        # Custom consumer hook for SocketContext
│       └── pages/                  # Top-Level Page Views
│           ├── Chat.jsx            # Main research app with sidebar, topbar & real-time chat
│           ├── Login.jsx           # Vercel-style multi-provider login (passkey, SSO, email)
│           ├── Register.jsx        # Multi-state signup flow with rotating customer proof ticker
│           ├── Terms.jsx           # Apple-grade Terms of Service with sticky TOC & progress bar
│           └── Privacy.jsx         # Apple-grade Privacy Policy with zero-training guarantee
│
└── server/                         # BACKEND APPLICATION (Node.js + Express + Socket.IO)
    ├── package.json                # Dependencies: express, socket.io, mongoose, langchain, @langchain/mistralai
    └── src/
        ├── index.js                # Server entry point, HTTP server, CORS, Socket.IO binding
        ├── config/
        │   └── db.js               # MongoDB connection setup with auto-reconnect & Mongoose options
        ├── middleware/
        │   └── auth.js             # Express middleware verifying JWT Bearer token on REST routes
        ├── models/                 # Mongoose Database Schemas
        │   ├── User.js             # User accounts, bcrypt password hashing, auth provider flags
        │   ├── Chat.js             # Research chat sessions, user ownership, auto-generated title
        │   └── Message.js          # Messages, roles, search flags, structured web citations array
        ├── routes/                 # REST API Controllers
        │   ├── auth.js             # /api/auth/register, /login, /me, /social-login
        │   └── chats.js            # /api/chats (GET list, POST new, GET single, DELETE, PATCH title)
        ├── socket/
        │   └── index.js            # Socket.IO JWT handshake auth, user rooms, message:send handler
        ├── agent/                  # Autonomous AI Engine
        │   ├── index.js            # LangChain AgentExecutor, tool calling, multi-turn DB history
        │   └── tavilyTool.js       # Tavily Search API wrapper with structured source metadata extraction
        └── tests/                  # Automated verification test suites
            ├── testAgent.js        # Direct test of Mistral + Tavily tool-calling agent
            ├── testAuthAndChatRoutes.js # Integration test of auth & chat REST APIs
            ├── testModels.js       # Unit tests for Mongoose models & validation
            └── testSocketAgent.js  # End-to-end WebSocket communication test
```

---

## 3. API, Route & Event Map

The **Interface Map** delineates every entrypoint, REST endpoint, and real-time WebSocket channel in Delvo.

### 3.1 Client Route Map (`React Router v6`)

| Route Path | Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `Chat.jsx` | **Protected** (Auth Required) | Main autonomous AI research interface and chat history. |
| `/login` | `Login.jsx` | Public | Multi-provider authentication (Passkey, SSO, OAuth, Email). |
| `/register` | `Register.jsx` | Public | Multi-step signup flow with social buttons & enterprise ticker. |
| `/terms` | `Terms.jsx` | Public | Apple-grade Terms of Service with sticky TOC & reading bar. |
| `/privacy` | `Privacy.jsx` | Public | Apple-grade Privacy Policy with Zero-Training guarantees. |
| `*` | `Navigate to="/"` | Catch-all | Fallback redirect for undefined routes. |

### 3.2 Backend REST API Endpoint Map

| Method | Endpoint | Auth Required | Request Body | Response Payload |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/health` | No | None | `{ status: "ok", timestamp }` |
| `POST` | `/api/auth/register` | No | `{ username, email, password }` | `{ user, token }` |
| `POST` | `/api/auth/login` | No | `{ email, password }` | `{ user, token }` |
| `POST` | `/api/auth/social-login`| No | `{ provider, email, username }` | `{ user, token }` |
| `GET` | `/api/auth/me` | **Yes** (Bearer) | None | `{ user }` |
| `GET` | `/api/chats` | **Yes** (Bearer) | None | `{ chats: [...] }` |
| `POST` | `/api/chats` | **Yes** (Bearer) | `{ title? }` | `{ chat: {...} }` |
| `GET` | `/api/chats/:id` | **Yes** (Bearer) | None | `{ chat, messages: [...] }` |
| `PATCH`| `/api/chats/:id` | **Yes** (Bearer) | `{ title }` | `{ chat: {...} }` |
| `DELETE`| `/api/chats/:id`| **Yes** (Bearer) | None | `{ message: "Chat deleted" }`|

### 3.3 WebSocket Real-Time Event Map (`Socket.IO`)

```mermaid
graph LR
    subgraph ClientEvents["Client to Server (Emitters)"]
        E1["socket.connect(auth: { token })"]
        E2["socket.emit('message:send', { chatId, content })"]
    end

    subgraph ServerEvents["Server to Client (Listeners)"]
        L1["socket.on('connect')"]
        L2["socket.on('message:received', userMessage)"]
        L3["socket.on('agent:thinking', { chatId })"]
        L4["socket.on('message:response', { message, chatId })"]
        L5["socket.on('agent:error', { error, chatId })"]
    end

    E1 -.->|JWT Handshake| L1
    E2 -.->|Dispatches Research| L2
    L2 -.->|Immediate Pulse| L3
    L3 -.->|On Completion| L4
    L3 -.->|On Exception| L5
```

---

## 4. Data Flow Journey Map

This map traces the path of data from the moment a user types a research question to its display on screen:

```mermaid
flowchart TD
    Step1["1. User types prompt in ChatWindow.jsx"] --> Step2["2. SocketContext emits 'message:send' over WSS"]
    Step2 --> Step3["3. Socket.IO verifies JWT & validates chat ownership in MongoDB"]
    Step3 --> Step4["4. User prompt saved to MongoDB (role: 'user')"]
    Step4 --> Step5["5. Server emits 'message:received' + 'agent:thinking' to client"]
    Step5 --> Step6["6. Client renders optimistic user message & glowing thinking indicator"]
    
    Step4 --> Step7["7. LangChain fetchChatHistoryFromDB queries last 10 messages"]
    Step7 --> Step8["8. Messages formatted into LangChain HumanMessage / AIMessage"]
    Step8 --> Step9["9. AgentExecutor evaluates prompt with System Routing Prompt"]
    
    Step9 --> Decision{Requires current facts / web facts?}
    
    Decision -- Yes --> Step10A["10a. Agent invokes 'tavily_search' tool"]
    Step10A --> Step11A["11a. Tavily API retrieves live web results & snippets"]
    Step11A --> Step12A["12a. Sources parsed into structured { title, url, snippet } array"]
    Step12A --> Step13A["13a. Mistral LLM synthesizes brief citing empirical sources"]
    
    Decision -- No --> Step10B["10b. Mistral LLM performs direct reasoning synthesis"]
    
    Step13A --> Step14["14. Output packaged with usedSearch flag & sources"]
    Step10B --> Step14
    
    Step14 --> Step15["15. Assistant message saved to MongoDB (role: 'assistant')"]
    Step15 --> Step16["16. Server emits 'message:response' to private room 'user:{userId}'"]
    Step16 --> Step17["17. Client MessageBubble.jsx renders Markdown, Search Badge & Citations"]
```

---

## 5. Autonomous Agent Decision Matrix

```mermaid
flowchart TD
    Start([User Submits Prompt]) --> Parse[Load Conversation History from DB]
    Parse --> Evaluate{Does prompt require current facts, live web data, or recent events?}
    
    Evaluate -- Yes --> Formulate[Agent Formulates Search Query]
    Formulate --> CallTavily[Execute Tavily Search API]
    CallTavily --> ExtractSources[Extract & Structure Sources: title, url, snippet]
    ExtractSources --> SynthesizeGrounded[Mistral LLM Synthesizes Cited Report]
    SynthesizeGrounded --> FlagSearch[Set usedSearch: true + Attach Sources]
    
    Evaluate -- No --> DirectLLM[Mistral LLM Synthesizes Direct Answer]
    DirectLLM --> FlagDirect[Set usedSearch: false + Empty Sources]
    
    FlagSearch --> SaveDB[(Store Message in MongoDB)]
    FlagDirect --> SaveDB
    SaveDB --> EmitUI[Emit Response to User Socket Room]
    EmitUI --> End([Research Cycle Complete])
```

---

## 6. Real-Time WebSocket & Agent Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant Socket as Socket.IO Server
    participant DB as MongoDB
    participant Agent as AgentExecutor (LangChain)
    participant Search as Tavily Search Engine
    participant LLM as Mistral AI Engine

    Note over User,Socket: Handshake with JWT Bearer Token
    User->>Socket: Connect (auth: { token })
    Socket->>Socket: Verify JWT & Join Room "user:{userId}"
    Socket-->>User: Connection Established

    User->>Socket: Emit "message:send" { chatId, content }
    Socket->>DB: Validate Chat Ownership
    Socket->>DB: Save User Message (role: "user")
    Socket-->>User: Emit "message:received" (Optimistic Echo)
    Socket-->>User: Emit "agent:thinking" (Thinking Bubble)

    Socket->>DB: Fetch last 10 messages for Chat History
    DB-->>Socket: Return History Array
    Socket->>Agent: runAgent({ input, chatId })

    alt Query requires real-time facts
        Agent->>Search: Invoke Tool "tavily_search"
        Search-->>Agent: Return Web Sources (title, url, snippet)
        Agent->>LLM: Synthesize Grounded Research Report
    else Query is analytical / conversational
        Agent->>LLM: Direct Inference (No Tool Call)
    end

    LLM-->>Agent: Final Synthesized Output
    Agent-->>Socket: Return { reply, usedSearch, sources }

    Socket->>DB: Save Assistant Message (role: "assistant", usedSearch, sources)
    Socket->>DB: Update Chat Title & Timestamp
    Socket-->>User: Emit "message:response" { message, chatId }
    Note over User: Render Markdown + Citations + Search Badge
```

---

## 7. Database Schema & Entity Relationship Map

```mermaid
erDiagram
    USER ||--o{ CHAT : owns
    CHAT ||--o{ MESSAGE : contains

    USER {
        ObjectId _id PK
        string username
        string email "unique, lowercase"
        string password "bcrypt salted hash"
        string authProvider "local, google, github, apple, passkey, sso"
        Date createdAt
        Date updatedAt
    }

    CHAT {
        ObjectId _id PK
        ObjectId userId FK "references USER"
        string title "auto-generated"
        Date createdAt
        Date updatedAt
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId chatId FK "references CHAT"
        string role "user | assistant | system"
        string content "markdown research brief"
        boolean usedSearch "true if web grounding triggered"
        array sources "structured citations"
        Date createdAt
        Date updatedAt
    }
```

---

## 8. Frontend Component & Context Hierarchy

```mermaid
graph TD
    App[App.jsx] --> ThemeProv[ThemeProvider]
    ThemeProv --> AuthProv[AuthProvider]
    AuthProv --> SocketProv[SocketProvider]
    SocketProv --> Router[BrowserRouter]

    Router --> RouteLogin["/login (Login.jsx)"]
    Router --> RouteRegister["/register (Register.jsx)"]
    Router --> RouteTerms["/terms (Terms.jsx)"]
    Router --> RoutePrivacy["/privacy (Privacy.jsx)"]
    Router --> Protected["/ (ProtectedRoute.jsx)"]

    Protected --> ChatPage[Chat.jsx]
    ChatPage --> Sidebar[Sidebar.jsx]
    ChatPage --> ChatWindow[ChatWindow.jsx]

    Sidebar --> SidebarList[Chat History List]
    Sidebar --> NewChatBtn[New Research Session]

    ChatWindow --> Topbar[Topbar.jsx]
    ChatWindow --> MessageList[Message Scroll Area]
    ChatWindow --> MessageInput[Chat Input Bar & Send Button]

    MessageList --> MessageBubble[MessageBubble.jsx]
    MessageBubble --> MarkdownBody[Formatted Markdown]
    MessageBubble --> SearchBadge[Web Grounding Badge]
    MessageBubble --> CitationDrawer[Structured Source Citations]
```

---

## 9. Security, Authentication & Zero-Training Model

Delvo incorporates enterprise-grade zero-trust principles across all layers:

### 1. Identity & Zero-Trust Authentication
- **Local Credentials**: Hashed with BCrypt ($\ge 10$ salt rounds). Plaintext passwords never touch logs or storage.
- **Hardware Passkeys (WebAuthn / FIDO2)**: Hardware-enclave cryptographic validation bound to user devices.
- **Enterprise SAML 2.0 Single Sign-On**: Federation with Okta, Azure AD, and Google Workspace.
- **OAuth 2.0 Providers**: Google, GitHub, Apple, OpenAI ChatGPT, GitLab, and Bitbucket.
- **Session Tokens**: Stateless JSON Web Tokens (JWT) signed with cryptographically secure secrets.

### 2. Zero Foundation Model Training Guarantee
- Delvo explicitly **never uses private research queries, uploaded documents, or chat history to train public foundation models**.
- All generative inference via Mistral AI is executed under enterprise zero-data-retention parameters.

### 3. Cryptography & Transport Security
- **In Transit**: Enforced TLS 1.3 encryption across all HTTPS endpoints and WSS socket streams.
- **At Rest**: AES-256 encrypted database volumes for MongoDB.
- **Isolation**: Multi-tenant logical isolation ensuring users only receive real-time events addressed to their private cryptographic room (`user:${userId}`).
