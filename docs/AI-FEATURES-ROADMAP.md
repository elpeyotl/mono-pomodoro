# 🤖 AI Features Roadmap - Mono Pomodoro

> Dieses Dokument beschreibt potenzielle AI-Integrationen für die Mono Pomodoro App.

---

## 📊 Konkurrenzanalyse

| App | Stärken | Schwächen | AI? |
|-----|---------|-----------|-----|
| **Pomofocus.io** | Einfach, kostenlos, beliebt | Keine AI, basic Features | ❌ |
| **Forest** | Gamification (Bäume pflanzen) | Kein Web, kostenpflichtig | ❌ |
| **Toggl Track** | Zeiterfassung, Reports | Komplex, Business-fokussiert | ❌ |
| **Notion** | Flexibel, Datenbank | Kein echter Pomodoro-Timer | 🟡 (AI für Docs) |
| **Todoist** | Task Management | Pomodoro nur via Integration | 🟡 (AI für Tasks) |
| **Session** | Schönes Design, Mac-native | Nur Apple, teuer ($50) | ❌ |

### Marktlücke
- **Keine App kombiniert Pomodoro + AI intelligent**
- **Keine personalisierte Produktivitätsanalyse**
- **Keine AI-gestützte Tagesplanung**

---

## 🎯 Feature 1: Smart Task Decomposition

### Konzept
AI zerlegt große Aufgaben automatisch in machbare Subtasks mit Pomodoro-Schätzungen.

### User Flow
```
┌─────────────────────────────────────────────────┐
│  Neue Aufgabe: "Website für Kunde X erstellen"  │
│                                                 │
│  [🤖 AI Breakdown]  [Manuell erstellen]         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  🤖 AI hat 6 Subtasks erstellt:                 │
│                                                 │
│  □ Requirements sammeln (2 🍅)                  │
│  □ Wireframes erstellen (2 🍅)                  │
│  □ UI Design in Figma (3 🍅)                    │
│  □ Frontend entwickeln (4 🍅)                   │
│  □ Backend API (4 🍅)                           │
│  □ Testing & Deployment (2 🍅)                  │
│                                                 │
│  📊 Geschätzte Gesamtzeit: ~7 Stunden           │
│                                                 │
│  [Übernehmen]  [Anpassen]  [Verwerfen]          │
└─────────────────────────────────────────────────┘
```

### Technische Umsetzung

```typescript
// server/api/ai/breakdown.post.ts
export default defineEventHandler(async (event) => {
  const { taskTitle, context } = await readBody(event)
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{
      role: "system",
      content: `Du bist ein Produktivitäts-Experte. Zerlege die Aufgabe in 
                konkrete Subtasks. Schätze für jeden Subtask die Anzahl 
                Pomodoros (25 Min). Antworte als JSON.`
    }, {
      role: "user",
      content: `Aufgabe: ${taskTitle}\nKontext: ${context || 'Keine'}`
    }],
    response_format: { type: "json_object" }
  })
  
  return JSON.parse(response.choices[0].message.content)
})
```

### Datenstruktur
```typescript
interface AIBreakdownResponse {
  subtasks: {
    title: string
    estimatedPomodoros: number
    category?: string
    priority?: 'high' | 'medium' | 'low'
  }[]
  totalPomodoros: number
  estimatedHours: number
  suggestions?: string[]
}
```

### Implementierungsaufwand
- **Komplexität**: Mittel
- **Geschätzte Zeit**: 2-3 Tage
- **Kosten**: ~$0.01-0.05 pro Anfrage (GPT-4)

---

## 🧠 Feature 2: AI Focus Coach

### Konzept
Ein persönlicher Produktivitäts-Coach, der deine Arbeitsgewohnheiten analysiert und personalisierte Empfehlungen gibt.

### Datenquellen (bereits vorhanden!)
```typescript
// Was wir bereits tracken:
interface UserProductivityData {
  // Pro Task
  tasks: {
    id: string
    title: string
    tags: string[]
    pomodoro_count: number      // Abgeschlossene Pomodoros
    total_focus_time: number    // Sekunden fokussiert
    created_at: Date
    completed_at?: Date
  }[]
  
  // Pro Session (neu zu tracken)
  sessions: {
    date: Date
    startTime: string           // "09:15"
    endTime: string             // "09:40"
    mode: 'focus' | 'break'
    completed: boolean          // Oder geskippt?
    taskId?: string
  }[]
}
```

### AI Coach Features

#### 2.1 Produktivitäts-Insights
```
┌─────────────────────────────────────────────────┐
│  📊 Deine Woche in Zahlen                       │
│                                                 │
│  🍅 23 Pomodoros abgeschlossen                  │
│  ⏱️ 9.5 Stunden fokussierte Arbeit              │
│  📈 +15% vs. letzte Woche                       │
│                                                 │
│  💡 AI Insight:                                 │
│  "Du bist zwischen 9-11 Uhr am produktivsten.   │
│   Tasks mit Tag 'Coding' dauern 20% länger      │
│   als geschätzt. Plane mehr Puffer ein."        │
└─────────────────────────────────────────────────┘
```

#### 2.2 Optimale Arbeitszeiten
```typescript
interface ProductivityPattern {
  // AI analysiert wann du am besten arbeitest
  peakHours: {
    morning: { start: "09:00", end: "11:30", score: 0.92 }
    afternoon: { start: "14:00", end: "16:00", score: 0.78 }
  }
  
  // Wochentags-Analyse
  bestDays: ['Dienstag', 'Mittwoch', 'Donnerstag']
  
  // Empfehlungen
  recommendations: [
    "Plane komplexe Tasks für den Vormittag",
    "Montags brauchst du mehr Aufwärmzeit",
    "Freitag nachmittag: Nur leichte Tasks"
  ]
}
```

#### 2.3 Motivations-Nudges
```
Nach jeder Pause zeigt AI kontextbezogene Nachrichten:

🎯 "Du hast heute schon 3 Stunden fokussiert! Weiter so!"

💧 "Tipp: Trink ein Glas Wasser vor der nächsten Session"

🏆 "Noch 2 Pomodoros bis zu deinem Tagesziel!"

⚠️ "Du hast heute 6 Sessions gemacht. Gönn dir eine längere Pause."

🌟 "Diese Woche: Bester Dienstag seit 3 Wochen!"
```

#### 2.4 Burnout-Prävention
```typescript
interface BurnoutIndicators {
  // Warnsignale die AI erkennt
  warnings: {
    tooManySessions: boolean      // >10 pro Tag
    noBreaksTaken: boolean        // Pausen werden geskippt
    lateNightWork: boolean        // Arbeit nach 22 Uhr
    weekendWork: boolean          // Regelmäßig am Wochenende
    decliningCompletion: boolean  // Weniger abgeschlossene Tasks
  }
  
  // AI generierte Empfehlung
  recommendation?: string
}
```

### Technische Umsetzung

```typescript
// server/api/ai/coach.post.ts
export default defineEventHandler(async (event) => {
  const { userId, timeRange } = await readBody(event)
  
  // 1. Daten aus Supabase laden
  const sessions = await getSessionsForUser(userId, timeRange)
  const tasks = await getTasksForUser(userId, timeRange)
  
  // 2. Statistiken berechnen
  const stats = calculateProductivityStats(sessions, tasks)
  
  // 3. AI Analyse
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{
      role: "system",
      content: `Du bist ein Produktivitäts-Coach. Analysiere die Daten 
                und gib 2-3 konkrete, personalisierte Empfehlungen.`
    }, {
      role: "user",
      content: JSON.stringify(stats)
    }]
  })
  
  return {
    stats,
    insights: response.choices[0].message.content,
    nudge: generateContextualNudge(stats)
  }
})
```

### Neue Datenbank-Tabelle
```sql
-- Für Session-Tracking
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  task_id UUID REFERENCES tasks(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  mode VARCHAR(20) NOT NULL, -- 'focus', 'shortBreak', 'longBreak'
  completed BOOLEAN DEFAULT false,
  skipped BOOLEAN DEFAULT false,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_sessions_user_date ON focus_sessions(user_id, started_at);
```

### Implementierungsaufwand
- **Komplexität**: Hoch
- **Geschätzte Zeit**: 1-2 Wochen
- **Voraussetzung**: Session-Tracking implementieren

---

## 🌊 Feature 3: Flow State Optimizer

### Konzept
AI erkennt wann du im "Flow" bist und optimiert die Timer-Einstellungen dynamisch.

### Was ist Flow?
Flow ist der Zustand maximaler Konzentration, in dem:
- Die Zeit wie im Flug vergeht
- Du Pausen vergisst oder überspringst
- Die Arbeit mühelos erscheint

### Flow-Indikatoren (messbar)
```typescript
interface FlowIndicators {
  // Positive Signale
  sessionCompleted: boolean       // Timer lief bis zum Ende
  noInterruptions: boolean        // Keine Pausen/Resets
  extendedSession: boolean        // User hat Timer verlängert
  quickBreakReturn: boolean       // Pause < 3 Min
  
  // Negative Signale
  earlySkip: boolean              // Timer vor 50% geskippt
  frequentPauses: boolean         // Mehrfach pausiert
  longBreak: boolean              // Pause > 10 Min
  
  // Berechnet
  flowScore: number               // 0-100
}
```

### Dynamische Timer-Anpassung

```
┌─────────────────────────────────────────────────┐
│  🌊 Flow State Detected!                        │
│                                                 │
│  Du bist gerade im Flow. Möchtest du:           │
│                                                 │
│  [+10 Min verlängern]  [Normal fortfahren]      │
│                                                 │
│  💡 Tipp: Im Flow-Zustand sind längere          │
│     Sessions oft produktiver.                   │
└─────────────────────────────────────────────────┘
```

### Flow Score Berechnung
```typescript
function calculateFlowScore(sessions: Session[]): number {
  const recentSessions = sessions.slice(-5) // Letzte 5 Sessions
  
  let score = 50 // Basis
  
  for (const session of recentSessions) {
    if (session.completed) score += 10
    if (session.skipped && session.progress < 0.5) score -= 15
    if (session.pauseCount === 0) score += 5
    if (session.extendedByUser) score += 15
  }
  
  return Math.max(0, Math.min(100, score))
}
```

### Adaptive Timer-Vorschläge
```typescript
interface AdaptiveTimerSuggestion {
  // Basierend auf Flow Score
  suggestedFocusDuration: number  // Minuten
  suggestedBreakDuration: number
  
  // Begründung
  reason: string
  
  // Beispiele:
  // Flow Score > 80: "Du bist im Flow! 35 Min Focus empfohlen"
  // Flow Score < 30: "Kurze Sessions helfen beim Einstieg. 15 Min?"
  // Nachmittags-Tief: "Kürzere Sessions am Nachmittag sind effektiver"
}
```

### UI Integration
```
┌─────────────────────────────────────────────────┐
│  ⚙️ Timer Settings                              │
│                                                 │
│  Focus Duration:  [25] Min                      │
│                                                 │
│  🤖 AI Empfehlung: 30 Min                       │
│     "Dein Flow Score ist hoch (85).             │
│      Längere Sessions könnten produktiver sein" │
│                                                 │
│  [AI Empfehlung übernehmen]                     │
└─────────────────────────────────────────────────┘
```

### Technische Umsetzung
```typescript
// composables/useFlowOptimizer.ts
export function useFlowOptimizer() {
  const timerStore = useTimerStore()
  const sessionHistory = ref<Session[]>([])
  
  const flowScore = computed(() => {
    return calculateFlowScore(sessionHistory.value)
  })
  
  const suggestion = computed(() => {
    if (flowScore.value > 80) {
      return {
        focusDuration: Math.min(45, timerStore.settings.focus + 10),
        reason: "Du bist im Flow! Längere Sessions empfohlen."
      }
    }
    if (flowScore.value < 30) {
      return {
        focusDuration: Math.max(15, timerStore.settings.focus - 10),
        reason: "Kürzere Sessions helfen beim Fokus-Aufbau."
      }
    }
    return null
  })
  
  return { flowScore, suggestion }
}
```

### Implementierungsaufwand
- **Komplexität**: Mittel-Hoch
- **Geschätzte Zeit**: 1 Woche
- **Voraussetzung**: Session-Tracking

---

## 🗺️ Implementierungs-Roadmap

### Phase 1: Foundation (1 Woche)
- [ ] Session-Tracking Tabelle erstellen
- [ ] Session-Events im Timer tracken
- [ ] Basis-Statistiken berechnen

### Phase 2: Smart Task Decomposition (3 Tage)
- [ ] OpenAI API Integration
- [ ] Breakdown UI Komponente
- [ ] Subtask-Import Logik

### Phase 3: AI Focus Coach (1-2 Wochen)
- [ ] Produktivitäts-Dashboard
- [ ] AI Insights API
- [ ] Motivations-Nudges

### Phase 4: Flow Optimizer (1 Woche)
- [ ] Flow Score Berechnung
- [ ] Adaptive Timer-Vorschläge
- [ ] Flow-Detection UI

---

## 💰 Kosten-Schätzung

| Feature | API Calls/User/Monat | Kosten/User |
|---------|---------------------|-------------|
| Task Breakdown | ~20 | ~$0.20 |
| AI Coach | ~30 | ~$0.30 |
| Flow Optimizer | Lokal | $0 |
| **Gesamt** | ~50 | **~$0.50/User/Monat** |

---

## 🎯 Empfohlene Reihenfolge

1. **Smart Task Decomposition** - Schneller Wow-Effekt
2. **Session Tracking** - Grundlage für alles weitere
3. **Flow Optimizer** - Keine API-Kosten, sofort nützlich
4. **AI Focus Coach** - Premium Feature

---

*Erstellt: 2026-01-08*
*Letzte Aktualisierung: 2026-01-08*
