# Wellus — Viva / presentation rehearsal

Below is one **rehearsal document**: **app-level theory**, then **each teammate** with **theory, file references, questions you may get, and short answer directions**, plus **extra app-wide cross-questions** for the panel.

Paths are under `wellus-app/` (Expo root).

---

# Part 1 — App theory (everyone should know this)

### What Wellus does

- **Problem:** People under-log food, misread labels, and drift from calorie/macro goals.  
- **Solution:** A mobile app to **log intake** (scan / manual / recipes), **store** it in **Convex**, **visualize** progress, **nudge** via **reminders**, **flag patterns** with **rules** (late eating, high sodium, etc.), and optionally use **LLM** features (coach chat, recipe ideas) **safely from the server**.

### Main ideas in simple terms

| Idea | Plain explanation |
|------|-------------------|
| **React Native / Expo** | One codebase for Android/iOS; **Expo Router** maps files in `app/` to screens. |
| **Convex** | Backend: **database + server functions**. **Queries** subscribe to data; **mutations** write; **actions** can call **external APIs** (e.g. OpenAI) with **server env** keys. |
| **Firebase Auth** | Login/signup; identity is separate from where meal rows live (Convex `users` table links conceptually). |
| **OCR** | Image → text → parse numbers (with **preprocessing** + **fallbacks** + **manual edit**). |
| **Adaptive monitoring** | Not magic: **rules over past logs** (time of day, averages vs goals). |
| **AI coach / recipes** | Large language model; **prompts** force **structured** answers where possible; **sanitize / retry** because APIs are unreliable. |

### High-level data flow

User taps screen → **React** updates UI → **Convex client** runs **query/mutation/action** → **DB or external API** → UI **re-renders** from new data.

---

# Part 2 — Dhairya (lead implementation & integration)

### Your story (one honest line)

*“I implemented and integrated most of the project: Convex data + AI actions, OCR and monitoring services, notifications integration, and wiring all screens to backend; others focused on presenting specific UI areas.”*

### Your theory (detail)

1. **Convex actions for AI** (`convex/Ai.js`): Phone never needs the raw API key in shipped config the same way as a client-only secret; **secrets in Convex env**.  
2. **Retries / rate limits**: Models return errors; **429** → **exponential backoff** so you don’t trip limits again immediately.  
3. **Prompt contracts**: Recipe / nutrition outputs should match **JSON shapes**; prompts in `constants/prompts.js`; output still treated as **unsafe string** until parsed.  
4. **Health coach reply cleanup**: `sanitizeHealthCoachReply` reduces markdown noise for in-app display.  
5. **Client wiring**: `utils/convexClient.js` + services in `services/ai/` call actions consistently.  
6. **OCR pipeline**: `services/ocr/*` — preprocessing, local ML Kit path, cloud fallback; **Scan.jsx** orchestrates UX.  
7. **Adaptive logic**: `AdaptiveMonitoringService.jsx` — transparent thresholds over **eating events**.  
8. **Bootstrap**: `app/_layout.tsx` initializes Convex, theme, auth flow.

### File references (core)

| Area | Files |
|------|--------|
| AI on server | `convex/Ai.js` |
| Prompts | `constants/prompts.js` |
| AI from app | `services/ai/HealthCoachService.jsx`, `services/ai/AiModel.jsx`, optional `services/ai/XAIService.jsx` |
| Convex client | `utils/convexClient.js` |
| App entry / providers | `app/_layout.tsx` |
| OCR stack | `services/ocr/LocalOCRService.jsx`, `OCRService.jsx`, `ImagePreprocessing.jsx` |
| Adaptive rules | `services/monitoring/AdaptiveMonitoringService.jsx` |
| Convex schema & domain | `convex/schema.js`, `convex/Users.js`, `Recipes.js`, `MealPlan.jsx`, `Tracking.js`, `Reminders.js` |
| Notifications helper | `utils/expoNotificationsGate.js`, `services/reminders/MealReminderScheduler.jsx` |

### Cross-questions for Dhairya (with answer direction)

| Q | Direction |
|---|-----------|
| Why not call OpenAI directly from the app? | **Key exposure**, uniform **error handling**, easier **rotation** and **logging** on server. |
| What is an **action** vs **mutation**? | **Mutation** = DB write in Convex; **action** = can do **fetch** to OpenAI, then optionally call internal mutations. |
| Model returns markdown or wrong JSON—what then? | **Strip fences**, **try/catch**, show **error** or partial fallback; mention your real code path. |
| Explain backoff. | Retry after **750ms, 1500ms…** on **rate limit** (`retryWithBackoff` in `convex/Ai.js`). |
| How does vision nutrition work (if you use it)? | **Image as base64/data URL** + text instructions in **chat completion** API. |
| How is multi-user isolation done? | **uid** on tables; **queries/mutations** scoped to current user (cite a concrete function you know). |
| Trade-off: ML Kit vs cloud OCR? | **Offline/latency/privacy** vs **accuracy** on bad labels. |
| Is this medical advice? | **Wellness / logging**; disclaim; refer to **doctors/dietitians** for conditions. |

---

# Part 3 — Lakshya (Home dashboard — React UI)

### Story

*“I’m most familiar with the Home experience: how we lay out today’s progress and macronutrients and refresh the view when data changes.”*

### Theory (detail)

- **`app/(tabs)/Home.jsx`**: Composes **dashboard components**; reads data from hooks / context / Convex **from parent or same file** — explain what *your* files actually do.  
- **`TodayProgress`**: Shows **daily progress** vs goals (circles, bars, text—describe what you see).  
- **`MacronutrientsDashboard`**: **Protein/carbs/fat** (and possibly sodium/sugar) **vs targets**.  
- **`HomeHeader`**: Greeting / date / quick actions.  
- **Lists & layout**: `ScrollView` / `FlatList`, **StyleSheet**, optional **pull-to-refresh** if present.  
- **Re-renders**: When Convex **query** result updates, React **re-renders** subscribed components.

### File references

| Focus | Files |
|--------|--------|
| Home screen | `app/(tabs)/Home.jsx` |
| Widgets | `components/dashboard/TodayProgress.jsx`, `components/dashboard/MacronutrientsDashboard.jsx`, `components/dashboard/HomeHeader.jsx` |
| Optional related | `components/dashboard/AdaptiveInsights.jsx` (if they only explain “this block shows insight cards”) |

### Cross-questions for Lakshya

| Q | Direction |
|---|-----------|
| What’s on Home and in what order? | **Header → progress → macros** (+ any card you show). |
| Where does the number data come from? | **Convex queries** (named in Home) or **context**—open `Home.jsx` and **memorize hook names**. |
| Loading / empty states? | **Skeleton**, **Spinner**, **“No data yet”**—point to exact `if (!data)`. |
| How would you change a macro color? | **`constants/colors.js`** + component styles. |

### If pushed past comfort

*“The exact Convex query wiring and meal-saving logic Dhairya implemented; I focused on composing and styling these dashboard components.”*

---

# Part 4 — Naman (Auth & profile — forms & profile UI)

### Story

*“I focus on onboarding entry points: Sign In / Sign Up and the Profile tab where users view and adjust their details.”*

### Theory (detail)

- **Controlled inputs**: `value={email}` + `onChangeText` → state is **source of truth**.  
- **Validation**: trim email, min password length, show **error text** in state.  
- **Auth flow**: Call **Firebase** sign-in/sign-up (from your files), then **navigate** to main app.  
- **Profile**: Display user fields; **edit** flows may call **mutations** or local state then save—**read `ProfileManager.jsx` and `Profile.jsx`** and say exactly what they do.  
- **Expo Router**: `router.replace` / `router.push` after success.

### File references

| Focus | Files |
|--------|--------|
| Auth | `app/auth/SignIn.jsx`, `app/auth/SignUp.jsx` |
| Profile | `app/(tabs)/Profile.jsx`, `components/profile/ProfileManager.jsx` |
| Shared inputs (if asked) | `components/common/shared/Input.jsx`, `Button.jsx` |

### Cross-questions for Naman

| Q | Direction |
|---|-----------|
| Sign-in vs sign-up difference? | **createUser** vs **signIn** APIs; different **validation** (e.g. confirm password on sign-up only). |
| Where is password stored? | **Not in Convex as plain text** — **Firebase** handles credentials. |
| What happens on failed login? | **catch** → set **error state** → show **Alert** or **Text**. |
| What fields does Profile show? | Name, email, goals, etc. — **match `ProfileManager.jsx`**. |

### If pushed past comfort

*“Firebase project and Convex user row sync were integrated by our tech lead; my section is the auth and profile UI behavior.”*

---

# Part 5 — Amika (Scan shell, reminders UI, water tracker)

### Story

*“I focus on the Scan experience for capturing and confirming food, the meal reminder configuration screen, and the water intake UI.”*

### Theory (detail)

- **Scan screen** (`Scan.jsx`): Buttons for **camera/gallery**; shows **preview**; **form** for nutrition fields; **save** triggers mutation (you can say “save calls backend” without parsing `Ai.js`).  
- **Corrections**: User can **edit** OCR mistakes before save—**trust but verify**.  
- **Reminders UI**: Toggles, **time** pickers, meal types; **schedule** via functions imported from `MealReminderScheduler.jsx`.  
- **Water tracker**: Increment/decrement or quick add; **optimistic UI** optional; persists via Convex (trace in `WaterIntakeTracker.jsx`).

### File references

| Focus | Files |
|--------|--------|
| Scan | `app/(tabs)/Scan.jsx` |
| Reminders | `app/meal-reminders/index.jsx`, `components/reminders/MealReminders.jsx` |
| Water | `components/tracking/WaterIntakeTracker.jsx` |
| Optional | `services/reminders/WaterReminderService.jsx` (if they mention water reminders) |

### Cross-questions for Amika

| Q | Direction |
|---|-----------|
| User flow on Scan? | **Image → extract/prefill → user edits → save to log**. |
| Why allow manual edit? | **OCR errors**; **regulatory label quirks**. |
| Do reminders need internet? | **Scheduled local notifications**; **permission** required; server optional for sync of *settings* if stored in Convex. |
| Water goal? | Daily **ml** target and **current total**—see component. |

### If pushed past comfort

*“OCR engines and Convex meal writes are integrated in services—Dhairya can walk through `LocalOCRService` / mutations; I cover the user-facing flow on these screens.”*

---

# Part 6 — Panel cross-questions about the **whole app** (anyone)

### Architecture & design

| Q | Short answer |
|---|----------------|
| Draw the system. | **Expo app → Convex (DB + functions) → OpenAI / OCR APIs**; **Firebase** for **auth**. |
| Why Convex? | **Realtime DB + serverless functions**; **actions** for **third-party APIs**. |
| Single source of truth for meals? | **Convex tables** e.g. `scannedFoods`, `mealPlan`, `recipes`. |
| Why separate `recipes` and `mealPlan`? | **Recipe** = content; **mealPlan** = **assignment to date + meal type + user**. |

### Data & security

| Q | Short answer |
|---|----------------|
| How do you scope data per user? | **`uid` / user id** on rows; queries filter by **logged-in user**. |
| Risks of AI nutrition numbers? | **Hallucination**; always **user confirmation** for scans; **disclaimer**. |
| API keys? | **Convex env** for AI; **EXPO_PUBLIC_** only for what must be on client—**acknowledge trade-offs**. |

### UX & reliability

| Q | Short answer |
|---|----------------|
| Offline behavior? | **ML Kit** may work **offline**; **Convex/AI** need **network**—state honestly. |
| Rate limits? | **Backoff / retries** in `convex/Ai.js`; friendly errors. |
| What if user ignores reminders? | **No guarantee**; product nudge only. |

### Testing & validation

| Q | Short answer |
|---|----------------|
| How did you test? | **Real devices** (camera, notifications), **manual flows**, **Convex dashboard** logs, **test accounts**. |
| Ground truth for macros? | **Label** as reference; **known test images**; compare OCR vs manual. |

### Ethics & real deployment

| Q | Short answer |
|---|----------------|
| Who should not rely on this alone? | People with **eating disorders**, **diabetes on insulin**, **renal disease**—need **clinicians**. |
| Future work? | **Barcode + food DB**, **export for dietitian**, **better offline queue**, **more languages on labels**. |

---

# Part 7 — Real-life usage (short)

- **Weight goals:** Log food + see calorie balance + weight trend.  
- **Hypertension awareness:** Track **sodium**; adaptive tips on high averages.  
- **Busy routines:** **Reminders** + quick **scan**.  
- **Cooking:** **AI recipes** (with human judgment on portions).  

---

## How to use this in the room

- **You (Dhairya):** Answer **anything** touching `convex/`, **`Ai.js`**, **`services/`**, schema, retries, OCR internals, Firebase/Convex linkage.  
- **Others:** Stay inside **their file list**; use the **“if pushed”** sentence to defer deep backend to you **without pretending they built it**.

If you want this turned into **printed one-pagers per person** or **spoken scripts timed to 2 minutes each**, say the time limit and language (English/Hindi mix, etc.).
