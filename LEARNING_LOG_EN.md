# Learning Log — English With Me

> Personal project log for building an AI-powered English learning companion app — Korean→English conversion, speaking practice, and more.

---

## Day 1 (2026-04-13 Sunday)

### Tools & Their Roles

This project is built with a mix of AI-powered tools that cover different roles in the development process — not just code.

| Tool | Role | What it did |
|---|---|---|
| **interview-me** (Claude skill) | Product Manager | Ran a structured interview to clarify the idea — target user, feature scope, success criteria, open questions. Replaced a messy brainstorm with a clean spec. |
| **Task Master AI** | Project Manager | Parsed the PRD and generated a dependency-ordered task list (10 tasks). Acts as a persistent backlog — tracks what's done, what's blocked, what's next. |
| **/teach-impeccable** (Claude skill) | Designer | Created `.impeccable.md` — the design context document. Defines brand personality (Calm · Clear · Capable), color palette, typography principles, and component rules. Referenced before building any UI. |
| **LangChain** | Developer (AI layer) | Model-agnostic abstraction for all LLM calls. Means we can swap OpenAI → Claude later with one line change. |
| **LangSmith** | Developer / DevOps | Automatic observability for all LangChain calls — latency, token usage, input/output logged with zero code changes. Activated via env vars only. |
| **Expo (React Native)** | Developer (frontend) | Cross-platform mobile framework — one codebase for iOS + Mac. Chosen over Streamlit (web-only) and pure Swift (iOS-only). |
| **FastAPI** | Developer (backend) | Python API server. Consistent with LangChain/SQLAlchemy ecosystem. Handles all AI calls and DB operations. |
| **PostgreSQL** | Developer (database) | Server-based relational DB — chosen over SQLite because multi-device sync requires a shared server, not a local file. |
| **Claude Code** | Developer + all of the above | Primary coding assistant. Wrote all backend and frontend code, debugged issues, managed the session context. |

---

### Why I Started This Project

I noticed that my English learning activities were completely fragmented — I was using Google Translate for quick conversions, asking Claude separately for more nuanced expressions, and had no consistent system for speaking practice or tracking what I'd learned. Every tool worked in isolation, and none of them knew my personal English style or goals.

The core problem: I had a clear target (Big Tech-level English — articulate, precise, warm) but no tool that applied that standard consistently across all the different ways I use English day-to-day.

**English With Me** is my attempt to consolidate all of that into one place: a Korean→English conversion tool that understands context (work meetings vs. casual WhatsApp vs. to-do list formatting), applies my personal English role model across every output, and logs everything so I can come back and practice what I've learned.

---

### Feature Development

**Project Setup**

- Initialized Expo (React Native) frontend + FastAPI backend monorepo structure under `english-with-me/`
- Set up PostgreSQL 16 (installed via Homebrew, service running at login)
- Created `english_with_me` database
- Backend: SQLAlchemy + psycopg2 for DB connection; `Base.metadata.create_all()` on startup → tables auto-created
- Initial tables: `users` (id, role_model_description) + `conversions` (id, user_id, category, sub_category, korean_input, outputs as JSONB)
- Backend `.env` symlinked to root `.env` → single source of truth for secrets

### Design Decisions

**Why Expo (React Native) from v1**

- Target: iOS (TestFlight) + Mac from day one — not a web-first prototype
- Expo gives iOS + Mac builds from a single codebase without native Xcode configuration upfront
- Streamlit (used in Study With Me) was ruled out immediately — no path to native mobile

**Why FastAPI**

- Python → consistent with my existing tooling (LangChain, SQLAlchemy)
- Async-native, fast to iterate on
- Clean separation: Expo talks to FastAPI via REST → decoupled frontend and backend from the start

**Why PostgreSQL (not SQLite)**

- This app is designed for multi-device from v1 (iOS + Mac) → SQLite is file-local, not shareable across devices
- PostgreSQL runs as a server → both devices can connect to the same DB (or via cloud hosting later)
- Relational structure fits the data model well (users → conversions with JSONB outputs)

**Why LangChain + LangSmith**

- LangChain: model-agnostic abstraction → v1 uses OpenAI (existing credits), v2 swaps to Claude with minimal code changes (just swap the LLM class)
- LangSmith: automatic tracing of all LangChain calls (latency, token usage, input/output) — activated via env vars only, zero code changes
- This is the same pattern used in Study With Me — proven to work

**Why OpenAI for v1**

- Have existing credits → no additional cost to start
- LangChain makes the future swap to Claude (Anthropic) nearly painless — the agent logic stays identical

**Task Master for project planning**

- PRD written first → Task Master parsed it into 10 dependency-ordered tasks
- Task Master uses OpenAI as its model provider (Anthropic provider caused issues in terminal — known bug from Study With Me)

### Issues & Solutions

**PostgreSQL not installed**

- `psql` command not found on initial check
- Solution: `brew install postgresql@16` + `brew services start postgresql@16`
- `psql` binary lives at `/opt/homebrew/opt/postgresql@16/bin/` — not on PATH by default. Used full path for initial setup; will add to PATH or use service going forward.

**Task Master: Anthropic provider fails in terminal**

- Configured Task Master with `anthropic` provider initially → same stack overflow error as Study With Me
- Solution: reverted to `openai` provider for Task Master. App itself still uses Claude/OpenAI via LangChain — Task Master is a separate tool with its own model config.

### Reflections

- Fragmented tools don't just waste time — they prevent a consistent standard from forming. One tool that knows your style beats five tools that don't.
- Deciding the stack before writing a line of code saved a lot of back-and-forth: Expo for native mobile, FastAPI for Python consistency, PostgreSQL for multi-device, LangChain for model flexibility.
- Starting with OpenAI credits and planning the Claude swap later is a pragmatic move — LangChain makes this a one-line change when the time comes.

> Key takeaway: tool fragmentation is a learning tax — every context switch costs memory and consistency

---

## Day 1 (2026-04-13 Sunday, continued)

### Feature Development

**User Profile API (Task 2 — backend)**

- `GET /users/me` — fetches profile; auto-creates the hardcoded user if not yet in DB
- `PATCH /users/me` — updates `role_model_description`
- `get_or_create_user()` helper handles v1's hardcoded user ID (`00000000-0000-0000-0000-000000000001`) — establishes user-based DB structure from day one without a sign-up flow
- Tested both endpoints manually via curl: GET returns `null` on first call, PATCH persists the role model description correctly

**Navigation — Hamburger Menu (custom drawer)**

- Replaced expo-router Tabs with a custom slide-in drawer menu
- Menu structure: Convert section (회사에서 / 일상에서 / To-do list) → divider → History / Settings
- `MenuDrawer.tsx`: Modal + `Animated.Value` slide animation (`translateX` from -280 to 0)
- `ScreenLayout.tsx`: shared wrapper with hamburger button (3-bar icon) + page title + menu overlay
- Each screen uses `ScreenLayout` — hamburger state is local to each screen, menu closes on navigation

**Design system**

- `constants/colors.ts` — `.impeccable.md` palette applied as typed constants (light + dark)
- `services/api.ts` — thin fetch wrapper for all backend calls
- `app/index.tsx` — redirects to `/(app)/work` on launch

### Design Decisions

**Why hamburger menu over bottom tab bar**

- Bottom tab bar keeps History/Settings permanently visible while the user is mid-conversion — adds visual noise with no benefit
- The core action (convert) should feel focused and uninterrupted
- Hamburger menu: nav is always one tap away but invisible until needed
- Categories (회사에서 / 일상에서 / To-do list) exposed directly in the menu — no extra drill-down required

**Why custom drawer instead of @react-navigation/drawer**

- `@react-navigation/drawer` requires `react-native-gesture-handler` + `react-native-reanimated`
- `react-native-reanimated` (new arch) tries to import `react-native-worklets` which is not available on web → bundling fails
- Custom drawer uses only React Native's built-in `Animated` + `Modal` — no extra dependencies, works on web and native, full design control
- Rule of thumb: avoid heavy animation libraries until native build is confirmed working

**Why `Modal` for the drawer overlay**

- `Modal` renders above everything including the keyboard — no z-index battles
- `Pressable` backdrop catches taps outside the drawer to close it
- On web, `Modal` behaves like a fixed overlay — consistent behavior across platforms

### Issues & Solutions

**iOS Simulator stuck on Apple logo (Expo Go install failed)**

- `expo start --ios` triggered Expo Go download + install to simulator
- Simulator booted slowly (Xcode 26 beta), crashed mid-install → `xcrun simctl install` exited with code 204 / Mach error -308 (IPC server died)
- Root cause: Xcode 26 (beta) + simulator not fully booted before install attempt
- Workaround: switched to `--web` for development; iOS simulator deferred until stable Xcode release

**`react-native-web` install: peer dependency conflict**

- `npx expo install react-native-web` failed — `react-dom@19.2.5` requires `react@^19.2.5`, project has `react@19.1.0`
- Solution: `npx expo install react-native-web -- --legacy-peer-deps` to bypass strict peer resolution, then `npm install react-dom@19.1.0 --legacy-peer-deps` to pin matching version
- Why `--legacy-peer-deps`: npm v7+ enforces strict peer resolution by default — `--legacy-peer-deps` reverts to npm v6 behavior (install anyway, warn but don't block)

**`expo-linking` missing at runtime**

- After switching to expo-router, bundler threw `Unable to resolve "expo-linking"` from `expo-router/build/global-state/routing.js`
- Root cause: `expo-linking` is a peer dependency of `expo-router` but not auto-installed by the blank template
- Solution: `npx expo install expo-linking -- --legacy-peer-deps`

**`react-native-reanimated` + `react-native-worklets` missing on web**

- Installing `@react-navigation/drawer` pulled in `react-native-reanimated` (new arch version)
- New arch reanimated imports `react-native-worklets` which doesn't exist on web → bundler error
- Solution: dropped `@react-navigation/drawer` entirely; implemented custom drawer with `Animated` + `Modal`
- Lesson: for web-compatible React Native projects, avoid libraries that depend on native-only Reanimated features until you have a confirmed native build pipeline

**`index.ts` still pointing to `App.tsx` after adding expo-router**

- Expo's blank TypeScript template uses `index.ts → App.tsx` as entry point
- expo-router expects `index.ts` to import `"expo-router/entry"` instead
- Solution: replaced `index.ts` content with `import "expo-router/entry"` and deleted `App.tsx`

### Reflections

- Web preview (`expo start --web`) is a fast feedback loop for layout and navigation — good enough for structural decisions before a native build is ready
- Custom UI components beat heavy navigator libraries when you control the design system — `Animated + Modal` gave us the exact drawer behavior we wanted with zero new dependencies
- Peer dependency conflicts in npm are common in Expo projects with newer React versions — `--legacy-peer-deps` is a pragmatic workaround, not a long-term solution; revisit when Expo SDK bumps its React peer requirement
- Navigation structure should reflect user workflow, not framework conventions — bottom tabs work for apps where users switch contexts frequently; a hidden menu works better when one screen dominates

> Key takeaway: fight for shallow navigation early — every extra tap compounds across thousands of daily uses


---

## Day 1 (2026-04-13 Sunday, session 3)

### Feature Development

**Convert Mode — full implementation**

- `POST /convert` endpoint: validates category + sub_category, calls LangChain agent, saves to `conversions` table, returns `{outputs, id}`
- `convert_agent.py`: `SUB_CATEGORY_META` maps `(category, sub_category)` → `{mode, description}` → injected into system prompt
- Output format: array of `{expression, situation_label, explanation}` — 2–3 options per call, differentiated by tone/formality
- `user_context` field: optional extra context from user → appended to human message → prevents AI from inferring unintended nuance

**Mode system — expanded from 3 to 4**

- Original: `speaking / texting / writing`
- Problem: `texting` conflated Slack messages (short, casual) and work emails (structured, formal) — same label, very different registers
- Revised: `speaking / messaging / email / writing`

| Mode | Register | Examples |
|---|---|---|
| `speaking` | Spoken, conversational | Face-to-face, video call, small talk |
| `messaging` | Short, casual, async typed | Slack, WhatsApp |
| `email` | Structured, complete, professional | Work email, email to prof |
| `writing` | Formal prose or scannable format | Thesis/paper, to-do items |

- Each mode has a distinct `MODE_INSTRUCTIONS` string injected into the system prompt → AI adapts register accordingly
- `SUB_CATEGORY_META` updated: `prof_email` + `messenger` moved from `texting` to their correct modes

**In Academia preset added**

- New preset: `prof_meeting` (speaking), `seminar` (speaking), `thesis` (writing), `prof_email` (email)
- Backend `VALID_CATEGORIES` updated to include `"academia"`
- Use case: husband in grad school — academia context more relevant than At Work

**Work Email sub-category added**

- New sub-category under At Work: `work_email` (email mode)
- Distinction from `messenger`: email implies full structure (greeting, body, sign-off); messenger is async chat

**History screen — full implementation**

- `GET /history?q=` endpoint: returns last 100 conversions ordered by `created_at DESC`; optional `q` param filters `korean_input` via `ILIKE`
- Frontend: search bar (triggers on 2+ chars), FlatList of cards
- Card behavior: tap to expand → shows all outputs; each output card tappable → copies expression to clipboard
- `getSubLabel()` + `getCategoryLabel()`: resolves category/sub_category keys → human-readable labels via `PRESETS`

**Single source of truth for preset data**

- Before: `work.tsx` and `friends.tsx` each hardcoded their own `SUB_CATEGORIES` array — diverged from `presets.ts`
- After: all screen files import directly from `PRESETS` via `PRESETS.find((p) => p.id === "work")`
- Rule: `presets.ts` is the only place to define sub-categories; screens just reference it

---

### Issues & Solutions

**Bundle 500 error: `Cannot find module 'react-native-worklets/plugin'`**

- Root cause: `react-native-reanimated` still in `package.json` after dropping `@react-navigation/drawer`
- Reanimated's Babel plugin (`react-native-reanimated/plugin`) tries to load `react-native-worklets` at bundle time — not available on web or without full native setup
- Solution: `npm uninstall @react-navigation/drawer react-native-reanimated react-native-gesture-handler`
- Lesson: removing a library from usage is not enough — must also uninstall it; Babel plugins run at bundle time regardless of whether the library is imported anywhere

**`index.tsx` still redirecting to `/(drawer)/work`**

- After dropping the drawer library, `index.tsx` still had `<Redirect href="/(drawer)/work" />` — not updated when the route group was renamed to `/(app)`
- Metro cache also retained the old route — needed `--clear` flag on restart
- Solution: updated redirect to `/(app)/work` + cleared Metro cache + cleared browser local storage (expo-router persists last route)

**Academia convert returning 400: "Invalid category: academia"**

- `convert_agent.py` already had academia support in `SUB_CATEGORY_META`
- But `VALID_CATEGORIES` in `convert.py` was never updated — validation rejected the request before reaching the agent
- Solution: added `"academia"` to `VALID_CATEGORIES` and aligned `VALID_SUB_CATEGORIES`
- Lesson: when adding a new category, two places need updating: agent metadata + API validation

**Chips missing in ConvertScreen for email/writing modes**

- `ConvertScreen.tsx` only filtered `speaking` and `texting` — `email` and `writing` chips were silently dropped
- Root cause: mode type in `SubCategory` interface was still `"speaking" | "texting" | "writing"` — no TypeScript error because `"email"` was just unused
- Solution: updated interface + added `email` and `writing` filter groups + updated mode badge text

**Expo Go not connecting: wrong IP after switching to hotspot**

- `BASE_URL` in `api.ts` was hardcoded to the previous WiFi IP (`172.31.130.252`)
- Switching Mac to iPhone hotspot assigned a new IP (`172.20.10.3`) → all API calls failed silently (spinner showed, no output)
- Solution: updated `BASE_URL` to new hotspot IP; app reloaded via Expo Go shake menu
- Note: IP must be updated whenever the Mac switches networks — a configuration friction point for development

---

### Testing

**Expo Go on real iPhone**

- Setup: iPhone personal hotspot → Mac connects to it → both on same local network
- `npx expo start` (without `--web`) shows QR code → scanned with Expo Go → app loaded on device
- Full convert flow tested on phone: chips, Korean input, AI output, tap-to-copy — all working
- Latency: GPT-4o API call ~5–10s — acceptable; spinner shown during loading

---

### Reflections

- Hardcoded values (IP address, route paths, sub-category arrays) create silent failures — they don't break at write time, they break when context changes
- Mode taxonomy matters more than it looks: `texting` vs. `email` is not just a label difference — it changes what the AI produces. Getting the abstraction right early prevents confusing outputs later.
- Testing on a real device surfaces issues invisible in browser: keyboard dismissal behavior, network reachability, actual latency feel

> Key takeaway: a 4-mode taxonomy (speaking / messaging / email / writing) maps more precisely to real English register than a 3-mode one — precision in the prompt → precision in the output

---

## Day 1 (2026-04-13 Sunday, session 4)

### Feature Development

**New sub-categories added**

- At Work: `presentation` (speaking) — "Presentation"
- In Academia: `conference_qa` (speaking) — "Conference Q&A"
- With Friends: `group_chat` (messaging) — "Group chat"
- `abstract` (writing) added then removed — overlapped with `thesis` conceptually; one chip per distinct writing task
- All 4 files updated per new sub-category: `presets.ts`, `colors.ts`, `VALID_SUB_CATEGORIES` in `convert.py`, `SUB_CATEGORY_META` in `convert_agent.py`

**UI mode grouping: 4 → 2**

- Before: chip section grouped into 4 rows (Speaking / Messaging / Email / Writing)
- After: collapsed to 2 rows (Speaking / Written) — messaging + email + writing → "Written"
- Backend mode values unchanged — AI prompt still receives exact mode per sub-category
- Change isolated to `ConvertScreen.tsx`: grouping logic replaced with binary speaking vs. non-speaking filter

**Last-used sub-category persistence**

- `@react-native-async-storage/async-storage` installed via `npx expo install`
- On chip select → `AsyncStorage.setItem("lastSub_${category}", key)`
- On screen mount → `AsyncStorage.getItem()` → restore saved chip if still valid
- Fallback: first chip in list if no saved value or saved key no longer exists

**History delete — swipe + long press**

- Backend: `DELETE /history/{item_id}` endpoint added to `history.py`; 404 if item not found or belongs to different user
- Frontend: `api.deleteHistory(id)` added to `api.ts`
- Swipe-to-delete: `Swipeable` from `react-native-gesture-handler` wraps each history card → red "Delete" button revealed on left swipe
- Long press: `onLongPress` on card `TouchableOpacity` → `Alert.alert` with Cancel / Delete (destructive) — works on web
- Optimistic UI update: `setItems(prev => prev.filter(...))` on delete → no reload needed
- `GestureHandlerRootView` added to root `_layout.tsx` — required for `Swipeable` to function

**History sub-category chip colors**

- Sub-category badge in history cards previously rendered as neutral gray (`c.surface` + border)
- Updated to `getChipStyle(item.sub_category, scheme)` → same color as chip in ConvertScreen
- Import: `getChipStyle` added to history.tsx color imports

---

### Design Decisions

**UX copy review — sub-category labels**

Reviewed all chip labels against 3 criteria: clear intent, first-time comprehension, mutual exclusivity

| Key | Before | After | Reason |
|-----|--------|-------|--------|
| `meeting` | "Face-to-face" → "In person" → "Work meeting" | **"In-person"** | Distinct from "Video call"; "Work" preset gives context |
| `messenger` | "Messenger" → "Work chat" | **"Slack"** | Slack = instantly recognizable proxy for work chat tools |
| `work_email` | "Work email" | **"Email"** | "Work" redundant inside At Work preset |
| `prof_meeting` | "Prof. meeting" | **"Advisor meeting"** | Natural English academia term; covers professor + senior mentor |
| `seminar` | "Seminar" → "Seminar talk" | **"Research talk"** | Specifies presenting role; "Seminar" ambiguous (presenting vs. attending) |
| `prof_email` | "Email to prof" | **"Professor email"** | Removes colloquial shortening |
| `whatsapp` | "WhatsApp" | **"Direct message"** | Platform-agnostic; clarifies 1:1 intent vs. Group chat |
| `abstract` | "Abstract" | **removed** | Subset of Thesis/Paper; redundant chip |

**"Research talk" — unfamiliar but correct**

- "Research talk" feels foreign to Korean grad students — not commonly heard in Korean academic context
- In English-speaking academia: fully standard ("I have a research talk next week")
- Decision: keep it — app's goal is to teach authentic English, not mirror familiar Korean proxies

**2-group chip layout — Speaking vs. Written**

- 4 separate mode rows (Speaking / Messaging / Email / Writing) added cognitive overhead with little navigation value
- "Written" umbrella covers messaging + email + writing — natural distinction mirrors how speakers think ("am I saying this or writing it?")
- Backend precision preserved — "Written" is a UI grouping only, not a new mode value

---

### Issues & Solutions

**`react-native-gesture-handler` not installed → blank screen**

- `Swipeable` imported in `history.tsx` → bundler threw `Unable to resolve "react-native-gesture-handler"`
- Package was a transitive dependency of `expo-router` but not directly installed
- Solution: `npx expo install react-native-gesture-handler`

**`GestureHandlerRootView` missing → blank screen**

- After installing the package, app rendered blank on web
- Root cause: `Swipeable` requires `GestureHandlerRootView` at the app root; without it, gesture handler context is undefined
- Solution: wrapped `<Stack>` in `<GestureHandlerRootView style={{ flex: 1 }}>` in root `_layout.tsx`
- Rule: any `react-native-gesture-handler` component requires `GestureHandlerRootView` at the tree root

**Dark mode button "floating" effect**

- Convert button (`#4A4030` warm brown) appeared detached against cool-toned dark background (`#1C1C1E`)
- Root cause: temperature mismatch — background was iOS system cool gray, button was warm amber-brown
- Solution: shifted dark mode tokens toward warm:
  - `background`: `#1C1C1E` → `#1E1C1B`
  - `surface`: `#2C2C2E` → `#2A2826`
  - `border`: `#3A3A3C` → `#383533`
  - `buttonBg`: `#4A4030` → `#3E3A32`
- First attempt (`#201D1A`) too warm → dialed back one step

---

### Q&A

**Q: Is "Advisor meeting" commonly used in English academia?**
- Yes — standard in North American grad school: "meeting with my advisor" / "advisor meeting"
- "Advisor" in English academia covers professor, supervisor, or senior mentor — broader than Korean "지도교수"
- Appropriate for 1:1, small group, or mixed seniority meetings in academic context

**Q: Conference Q&A — am I the questioner or answerer?**
- Both — same chip covers either role
- Questioner: "Could you elaborate on the methodology?"
- Answerer: "That's a great point — what we found was..."
- Common thread: spontaneous, concise spoken English under expert-audience pressure

---

### Reflections

- Label quality is a UX problem, not a copy problem — "Messenger" isn't wrong, it's just imprecise enough to cause hesitation at the moment of selection
- Platform-specific labels ("WhatsApp", "Slack") trade breadth for instant recognition — acceptable when the platform is the dominant cultural reference
- Color temperature coherence matters even when the values are close — 2 points of warmth shift (`#1C1C1E` → `#1E1C1B`) was enough to eliminate the floating effect

> Key takeaway: UX copy review with 3 explicit criteria (clear intent · first-time comprehension · mutual exclusivity) surfaces problems that visual review misses

---

## Day 2 (2026-04-14 Monday)

### Feature Development

**Network IP update for Expo Go**

- WiFi network changed overnight → Mac assigned new IP (`172.20.10.3`)
- `BASE_URL` in `api.ts` updated: `192.168.1.194` → `172.20.10.3`
- Backend restart required with `--host 0.0.0.0` flag to accept external connections

---

### Q&A

**Q: FastAPI — is it for building APIs that AI agents call?**

- In English With Me: client is the **Expo frontend**, not an AI agent
- FastAPI receives HTTP requests from Expo → internally invokes LangChain/GPT-4o → returns response
- Flow: `Expo app → FastAPI → LangChain (AI)` — AI is an internal dependency, not the caller
- "Tool" in AI agent context = function registered to an agent; unrelated to FastAPI endpoints

**Q: FastAPI, uvicorn, Railway — roles and why these over alternatives**

- **FastAPI** — defines what each endpoint does (routes + handler logic)
  - vs. Flask: no type validation, slower; vs. Django: too heavyweight for API-only server
  - chosen for: Python ecosystem consistency (LangChain, SQLAlchemy) + async-native + auto type validation
- **uvicorn** — opens the port and executes the FastAPI app; receives incoming HTTP requests
  - vs. gunicorn: synchronous → cannot leverage FastAPI's async capabilities
  - chosen for: designed specifically for async ASGI frameworks like FastAPI
- **Railway** — runs uvicorn on a remote server 24/7 with a public URL
  - uvicorn still runs inside Railway — Railway doesn't replace uvicorn, it hosts it
  - vs. AWS/GCP: excessive setup complexity for personal projects; vs. Render: sleeps after 30min inactivity
  - chosen for: existing account + 3-command deploy + validated in AI Agents course

**Q: Are FastAPI endpoint URLs and Expo route URLs both called "URLs"?**

- Both are URLs — "URL" = address of any resource, broad term
- More precise names differ by context:

| Address | Precise term | Owner |
|---|---|---|
| `localhost:8000/convert` | **API endpoint** | FastAPI / backend |
| `localhost:8081/history` | **Route** (page URL) | expo-router / frontend |

- "Endpoint" → almost always refers to a backend API address in practice
- "Route" → frontend screen path; expo-router auto-maps file paths (`app/(app)/history.tsx`) to URL segments (`/history`)
- Same word after the slash (`/history`) is coincidental — both named after the same feature, no technical relationship

**Q: Does Railway replace uvicorn?**

- No — Railway hosts the environment; uvicorn runs inside it
- Local: `uvicorn` runs on MacBook → accessible at `localhost:8000`
- Railway: `uvicorn` runs on Railway's server → accessible at `https://my-app.railway.app`
- Deployed start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - `--host 0.0.0.0`: accept requests from any IP (not just localhost)
  - `--port $PORT`: use port assigned by Railway, not hardcoded 8000

> Key takeaway: FastAPI defines behavior, uvicorn executes it, Railway hosts it — three distinct layers, each replaceable independently

---

## Day 2 (2026-04-14 Monday, continued)

### Feature Development

**Design System — ThemeContext + Color token expansion**

- `ThemeContext.tsx`: wraps app in `createContext`; exposes `scheme` + `setScheme`
  - Scheme values: `"light" | "dark" | "warm"` (typed as `AppScheme`)
  - Persistence: `AsyncStorage.getItem("theme")` on mount → restores last selection
  - `AppScheme` propagated to all screens via `useAppTheme()` hook
- `constants/colors.ts` refactored:
  - `Colors.light / Colors.dark / Colors.warm` — full token sets, not just palette
  - P palette (0–10): indices 0–6 → expression badge colors (cycling); 7–10 → category chip colors (fixed)
  - `getChipStyle(subKey, scheme)`: maps sub-category key → `{ bg, text }` pair
  - `getPaletteStyle(idx, scheme)`: maps P palette index → `{ bg, text }` pair
  - `getPresetStyle(presetId, scheme)`: maps category key → `{ bg, text }` pair

**Warm theme token definition**

- Motif: parchment background (`#F0EDEA`) + white cards (`#FFFFFF`) — contrast within warmth
- `buttonBg`: `#242018` (olive-dark, same as light) — avoids the warm-brown cast of `#2C211A`
- Full token set:

```typescript
warm: {
  background: "#F0EDEA",   // parchment
  surface: "#FFFFFF",      // white cards on cream
  border: "#E2DDD8",
  textPrimary: "#1A1614",
  textSecondary: "#8A7A72",
  buttonBg: "#242018",
  buttonText: "#FFFFFF",
  accent: "#E8FF38",
  accentSubtle: "#F7FFBA",
  error: "#C0392B",
  shadow: "#000000",
}
```

**Learn Mode screen**

- `app/(app)/learn.tsx`: generate 5 curated expressions for a selected category + sub-category
- Flow: select category chip → select context chip → optional details → "Generate expressions"
- `POST /learn` backend endpoint: `LearnRequest { category, sub_category, details? }` → `learn_agent.py`
- Enabled modes filtering: `useEffect` loads `enabled_modes` from profile API on mount → filters `PRESETS` to show only active categories
- Button label: `"Generate expressions"` on first load → `"Refresh"` after first generation

**Review Mode screen**

- `app/(app)/review.tsx`: flashcard-style review of conversion history
- Per card: Korean input shown → tap to reveal all English outputs
- Badge randomization: `badgeOffset` state initialized with `Math.floor(Math.random() * 7)` and re-randomized per card advance → different palette per card
  - Index formula: `getPaletteStyle((idx + badgeOffset) % 7, scheme)` — keeps within P0–6 range
- Outputs wrapped in `ScrollView` with `flex: 1` container to prevent overflow

**Terminology finalized: Category / Context / Details**

- **Category** (preset): At Work / In Academia / With Friends / To-do list — the top-level menu group
- **Context** (sub-category chip): In-person / Video call / Slack / etc. — the situational chip within a category
- **Details** (optional input): free-text field for extra situational nuance passed to the AI
  - Renamed from "Add context" → avoids collision with the Context chip meaning

**"Add details" in Convert + Learn**

- Toggle button `"+ Add details (optional)"` / `"Hide details"` → reveals `TextInput`
- Backend: `details` passed in request body → `learn_agent.py` appends as `\nAdditional details from the user: {details}` in system prompt
- Convert: `user_context` field already existed → renamed in UI label only

**Settings improvements**

- Display section: segmented control pattern (iOS-native feel)
  - Container: `backgroundColor: c.surface`, `borderRadius: 12`, `padding: 3`, `gap: 2`
  - Active option: `backgroundColor: c.background` + subtle shadow — mimics iOS `UISegmentedControl`
  - `key={scheme}` on container → forces remount on scheme change → prevents flash
- Sticky Save bar: moved outside `ScrollView` → always visible when `isDirty` or status is `"saved"` / `"error"`
  - Pattern: `{(isDirty || status === "saved" || status === "error") && <View style={s.saveBar}>...}`
  - Eliminates need for user to scroll down to find Save button after editing

**ExpressionCard refactor**

- `components/ExpressionCard.tsx` extracted: shared card used by Convert + Learn
- Props: `expression`, `situationLabel`, `explanation`, `badgeStyle`, `scheme`, `onPress`, `copied`
- Internal `useMemo(() => makeStyles(c), [scheme])` — avoids StyleSheet recreation on every render
- Removed ~8 duplicate style definitions from each screen

---

### Design Decisions

**Warm theme — parchment + white vs. warm-tinted everything**

- Option A: entire UI in cream/warm tones → no contrast between surface and background
- Option B (chosen): `background = #F0EDEA` (parchment), `surface = #FFFFFF` (white) → cards "lift" visually, legible contrast with minimal desaturation

**Segmented control for theme selector, not toggle chips**

- Toggle chips (like category chips): visually implies multi-select
- Segmented control: visually implies mutually exclusive single selection — matches the actual behavior (one theme active at a time)
- iOS-native pattern: reduces cognitive overhead vs. custom chip layout

**Sticky Save bar**

- Option A: Alert prompt when navigating away with unsaved changes → too disruptive
- Option B: Save button always at bottom of scroll → invisible when settings list is long
- Option C (chosen): Sticky bar outside scroll → visible as soon as any field changes; disappears when no unsaved changes

**`useMemo(() => makeStyles(c), [scheme])` pattern**

- `makeStyles(c)` returns a `StyleSheet.create(...)` object — relatively expensive to recreate
- Without memo: recreates on every render triggered by any state change
- With `useMemo`: recreates only when `scheme` changes (which also changes `c`)
- Dependency is `scheme`, not `c` — `c = Colors[scheme]` is a reference that changes every render; `scheme` is a stable string

---

### Issues & Solutions

**TextInput text invisible in light mode when system is dark mode**

- iOS system dark mode overrides `TextInput` text color natively, even when the app is rendering in light theme
- `style={{ color: c.textPrimary }}` in `StyleSheet.create()` doesn't reliably override the native override
- Fix: pass `color` as inline style directly on the element: `style={[s.input, { color: c.textPrimary }]}`
- `key={scheme}` on `TextInput` forces full remount when scheme changes → text color applied fresh

**"Two children with same key" error**

- `<View key={scheme}>` (themeSelector) and `<TextInput key={scheme}>` both rendered as siblings inside the same `ScrollView`
- When `scheme = "warm"`, both received `key="warm"` → React warning: duplicate keys among siblings
- Fix: give each element a unique key string — `key={scheme}` on the View; `key={\`rolemodel-${scheme}\`}` on the TextInput

**Display button flash on theme switch**

- When switching from light → dark: active button background was `c.textPrimary` (black in light, white in dark)
- For one frame, the component saw old `scheme` but new `c` values → button showed wrong color
- Fix: `key={scheme}` on the container `View` → remounts the entire segmented control fresh on scheme change; no intermediate state visible

**`useCallback` stale closure on `details` state**

- `handleGenerate` in Learn screen: `useCallback(..., [selectedCategory, selectedSub])`
- `details` read inside the callback but not listed in deps → always captured `""` (initial value)
- Fix: added `details` to dependency array: `[selectedCategory, selectedSub, details]`
- Rule: every state variable read inside `useCallback` must appear in its dependency array

**Review text overflow**

- Long English expressions exceeded card height; text clipped at card boundary
- Root cause: card had fixed height; outputs `View` had no scroll behavior
- Fix: wrap outputs in `<ScrollView showsVerticalScrollIndicator={false}>` inside an `Animated.View` with `flex: 1`

---

### Reflections

- iOS system dark mode intercepts native component rendering below React's control — inline style overrides and key-forced remounts are the reliable escape hatch
- `key` prop duplicates across siblings are silent in development but produce warnings — naming keys by their semantic role (not just `scheme`) prevents the collision
- Segmented control and toggle chip look similar but communicate different selection semantics — using the wrong pattern adds cognitive load without the user knowing why it feels off
- `useCallback` deps and `useMemo` deps require the same discipline as SQL foreign key constraints — missing one silently causes stale or incorrect behavior

> Key takeaway: React's key prop is a remount trigger, not just a reconciliation hint — forcing remount via `key={scheme}` is the cleanest fix for native component color overrides that ignore style updates
