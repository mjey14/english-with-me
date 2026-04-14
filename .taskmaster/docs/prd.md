# English With Me — Product Requirements Document

## Overview

**Product Name**: English With Me  
**Type**: Personal AI-powered English learning companion  
**Target User**: Korean professional targeting Big Tech-level English, currently using separate tools (Google Translate, Claude, etc.) for each English learning activity  
**Problem**: English learning activities (Korean→English conversion, speaking practice, podcast study) are scattered across multiple tools with no unified personal style applied  
**Goal**: Replace all those separate tools with one app that centralizes English learning, with the user's personal English role model applied consistently across all outputs

---

## Version Roadmap

| Version | Stack | Status |
|---|---|---|
| v1 | Expo (React Native), FastAPI, PostgreSQL, OpenAI/Claude | ✅ Feature-complete, TestFlight pending |
| v2 | Same stack + Speaking practice, To-do integration, Podcast mode | 🔜 Planned |

---

## Success Criteria

User naturally replaces their current individual tools with this app for English learning activities.

---

## Design Principles

- No emojis in UI
- Minimal and calm — no distractions
- Warm, approachable tone (not clinical/educational)
- Color palette: TBD (define in `.impeccable.md` before UI build)
- Design context stored in `.impeccable.md`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Expo (React Native) — iOS + Mac |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| AI | OpenAI (v1) → Claude API (v2, LangChain으로 모델만 교체) |
| Distribution | iOS: TestFlight / Mac: direct build |

---

## Authentication

- **v1**: Hardcoded user ID — no sign-up flow (personal use only)
- **v2+**: Proper auth if/when opened to others

---

## English Role Model (User Profile)

- Stored per user in DB
- User writes a free-text description of their target English style
  - Example: "Michelle Obama / Cate Blanchett style — articulate, eloquent, warm but powerful, precise word choice. Not casual texting style."
- Applied as a system-level instruction to ALL AI outputs in the app
- Editable anytime from Settings

---

## Features

### v1

#### 1. Convert Mode (Korean → English)

**Purpose**: Replace ad-hoc use of Google Translate / Claude with a context-aware, role-model-styled conversion tool.

**Flow**:
1. User selects a category + sub-category
2. User types Korean text
3. App returns 2–3 English expression options, each differentiated by situation/nuance
4. User copies or lightly edits the chosen expression

**Preset Modes** (user selects which appear in their menu):

| Preset ID | Label | Sub-categories (Context) | Default |
|---|---|---|---|
| `work` | At Work | In-person (speaking), Video call (speaking), Small talk (speaking), Presentation (speaking), Slack (messaging), Email (email) | On |
| `academia` | In Academia | Advisor meeting (speaking), Research talk (speaking), Conference Q&A (speaking), Thesis/Paper (writing), Professor email (email) | Off |
| `friends` | With Friends | In-person (speaking), Direct message (messaging), Group chat (messaging) | On |
| `todo` | To-do list | — | On |

User enables/disables presets from Settings. Menu and Learn screen both show only enabled presets.

**Mode system** (4 modes, not shown in UI — used internally for AI prompt):

| Mode | Register | Covers |
|---|---|---|
| `speaking` | Spoken, conversational | Face-to-face, video call, small talk, presentations |
| `messaging` | Short, async, casual | Slack, WhatsApp, group chat |
| `email` | Structured, complete | Work email, professor email |
| `writing` | Formal prose / scannable | Thesis, to-do items |

UI groups: **Speaking** (mode=speaking) vs. **Written** (messaging + email + writing) — 2 rows, not 4.

**Terminology (UI)**:
- **Category**: top-level preset group (At Work / In Academia / etc.)
- **Context**: sub-category chip within a category (In-person / Video call / Slack / etc.)
- **Details**: optional free-text input for extra situational nuance — passed to AI prompt

**User actions after output**:
- Tap any expression card → copies to clipboard
- (No inline edit in v1)

**Output format** (per option):
- The English expression
- Short label describing the situation/nuance it fits (e.g., "More formal, suitable for manager", "Casual, peer-to-peer")
- Brief note on why it's phrased this way (especially for To-do list — format/structure explanation)

**To-do list category behavior**:
- Goal: teach how native English speakers write to-do items (verb phrase vs. noun phrase, level of detail, etc.)
- Output includes format explanation alongside the expression
- Example input: "M&S 들러서 장보기" → Output: `Pick up groceries at M&S` + "Native to-do items use verb phrases, not full sentences. Start with an action verb."

**Role model**: User's saved profile applied to tone and word choice across all outputs.

**Conversion Log**:
- Every conversion is automatically saved to history (no explicit save action)
- Log stores: original Korean, category, sub-category, all output options, timestamp
- Browsable from History screen (searchable by Korean or English)
- Delete: swipe-to-delete (Swipeable) or long-press → Alert confirm
- Used as source material for Review Mode + Speaking practice (v2)

---

#### 2. Learn Mode

**Purpose**: Generate 5 curated expressions for a selected category + context — useful when the user wants to proactively learn expressions, not just convert specific text.

**Flow**:
1. Select category (enabled presets only)
2. Select context sub-category
3. Optionally add details
4. Tap "Generate expressions" → AI returns 5 expressions with situation labels + explanations
5. Tap "Refresh" to generate a new set

**Backend**: `POST /learn` → `learn_agent.py`
- `LearnRequest { category, sub_category, details? }`
- Response: `{ expressions: [{expression, situation_label, explanation}] }` (5 items)

---

#### 3. Review Mode

**Purpose**: Flashcard-style review of past conversions from History.

**Flow**:
1. Korean input shown on card
2. Tap to reveal English outputs
3. Badge colors randomized per card (P palette 0–6 with random offset)
4. Swipe / button to advance to next card

**Source**: Conversion history (`conversions` table)
- Oldest-first or random order TBD
- Cards that are deleted from History no longer appear in Review

---

#### 4. Settings

**Sections**:
- **Active Modes**: toggle each preset on/off — affects Convert menu AND Learn screen
- **Display**: segmented control selecting Light / Dark / Warm theme (persisted via AsyncStorage)
- **English Role Model**: free-text description of target English style

---

### v2

#### 2. Speaking Practice

**Purpose**: Check whether the user has memorized expressions from Convert Mode and can say them out loud.

**Source**: Conversion log from v1

**Flow**:
1. User picks expressions to practice (from log)
2. App shows the Korean original → user recalls and speaks the English aloud
3. User records themselves
4. AI gives pronunciation feedback
5. (Later phase) Alternative expression suggestions after memorization is confirmed

**AI feedback scope (v1 of Speaking)**:
- Pronunciation correction only
- Alternative expressions deferred until user demonstrates memorization

#### 3. To-do Integration

- Manage a to-do list within the app (not just convert)
- Items stored in English; original Korean preserved as note
- Deferred to v2

#### 4. Podcast Study Mode

- TBD — concept not yet defined
- Deferred to v2

---

## Data Model (v1)

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| role_model_description | TEXT | Free-text English style description |
| enabled_modes | TEXT[] | Array of enabled preset IDs (default: ["work","friends","todo"]) |
| created_at | TIMESTAMP | |

### conversions
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users |
| category | TEXT | work / academia / friends / todo |
| sub_category | TEXT | in_person / video_call / slack / email / small_talk / presentation / advisor_meeting / research_talk / conference_qa / thesis / prof_email / direct_message / group_chat / null |
| korean_input | TEXT | Original Korean text |
| outputs | JSONB | Array of {expression, situation_label, explanation} |
| created_at | TIMESTAMP | |

---

## Design System

### Theme
- 3 schemes: Light, Dark, Warm
- Persisted via `AsyncStorage`
- Warm motif: `background = #F0EDEA` (parchment), `surface = #FFFFFF` (white cards on cream)

### Color Tokens (`constants/colors.ts`)
- Each scheme defines: `background, surface, border, textPrimary, textSecondary, buttonBg, buttonText, accent, accentSubtle, error, shadow`
- P palette (0–10): indices 0–6 for expression badges (cycled), 7–10 reserved for category chips
- Helpers: `getChipStyle(subKey, scheme)`, `getPaletteStyle(idx, scheme)`, `getPresetStyle(presetId, scheme)`

### Shared Components
- `ExpressionCard`: used in Convert + Learn screens; props: expression, situationLabel, explanation, badgeStyle, scheme, onPress, copied
- `ScreenLayout`: shared wrapper with hamburger button + page title + drawer overlay
- `ExpressionCard` uses `useMemo(() => makeStyles(c), [scheme])` internally

---

## Navigation (v1)

**Hamburger menu (custom drawer)** — replaces bottom tab bar
- Convert group: At Work / In Academia / With Friends / To-do list (enabled presets only)
- Divider
- Learn
- Review
- History
- Settings

No persistent tab bar — menu hidden until hamburger tapped (reduces distraction during conversion flow)

---

## Out of Scope (v1)

- Public distribution / App Store launch (quality-dependent, v2+)
- Speaking practice
- To-do list management within app
- Podcast study mode
- Push notifications
- Multi-user / social features
