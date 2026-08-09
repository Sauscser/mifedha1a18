# AI Chat Navigator - Visual Guide

## 🎨 Header Layout

### Current Header Structure
```
Before (Original):
┌───────────────────────────────────────────────────┐
│ ☰                Welcome, John        Sign Out    │ Row 1: Menu + Actions
└───────────────────────────────────────────────────┘

After (With Chat):
┌───────────────────────────────────────────────────┐
│ ☰  🤖            Welcome, John        Sign Out    │ Row 1: Menu + Chat + Actions
└───────────────────────────────────────────────────┘
```

### Detailed Component Layout
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ☰        🤖                                  Welcome, John  ✕  │
│  (Menu)   (Chat)                             (Greeting)   (Exit)│
│                                                                 │
│  ← menuRow with gap={8} →  ← actionRow →                       │
│                                                                 │
│  Gap between menu & chat: 8px                                  │
│  Greeting text color: #fff                                    │
│  All icons: white (#fff)                                      │
│  Background: Linear gradient (#e29d58 → skyblue)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📲 Chat Modal Flow

```
HOME SCREEN
    │
    ├─ User taps 🤖
    │
    ├─ ChatBotModal opens (full screen overlay)
    │
    ├─ Welcome message displays
    │
    ├─ User types query
    │   ├─ "What is Pal-Pal?"
    │   ├─ "Tell me about benefits"
    │   └─ "Take me to Chama"
    │
    ├─ Bot processes query
    │   ├─ Search productDatabase
    │   ├─ Format response in user's language
    │   └─ Generate message
    │
    ├─ Bot response appears
    │
    ├─ User can:
    │   ├─ Ask follow-up question
    │   ├─ Clear chat history
    │   └─ Close modal (X button)
    │
    └─ Returns to previous screen state

```

## 🎯 Chat Modal Interface

```
┌──────────────────────────────────────┐
│  MiFedha Navigator                ✕  │ Header (#e29d58)
├──────────────────────────────────────┤
│                                      │
│  Hello! 👋 Welcome to MiFedha        │ Welcome message
│  I can help you navigate...          │
│                                      │
│  User: "What is Pal-Pal?"       ➜   │ Message bubble
│                                      │ (blue, right-aligned)
│  ⏳ Bot thinking...              ⏳   │ Loading indicator
│                                      │
│  Bot: "Pal-Pal is a peer-to-peer... │ Message bubble
│       • Borrow from trusted friends" │ (gray, left-aligned)
│       • Flexible repayment..."       │
│                                      │
│  User: "Take me there!"         ➜   │
│                                      │
│  Bot: "Opening Pal-Pal screen..."   │
│                                      │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ Ask about products...          │  │ Input field
│  │  [────────────────────] [Send] │  │
│  └────────────────────────────────┘  │
│            [Clear]                   │ Clear button
└──────────────────────────────────────┘
```

## 📱 Screen Navigation

```
APP (ChatBotProvider wrapper)
    │
    ├─ App.tsx
    │
    ├─ RootNav
    │   │
    │   ├─ NavigationContainer
    │   │
    │   ├─ Stack Navigator
    │   │
    │   ├─ Drawer Navigator
    │   │   │
    │   │   ├─ GlobalHeader (with 🤖 icon)
    │   │   │   └─ menuRow: [☰, 🤖] + actionRow: [Welcome, Exit]
    │   │   │
    │   │   ├─ HomeTab
    │   │   ├─ MFNdogo
    │   │   ├─ MFKubwa
    │   │   └─ ... other screens
    │   │
    │   └─ ChatBotModal (overlay - renders on top)
    │       └─ Appears when isOpen = true
    │
    └─ StatusBar
```

## 🌐 Supported Products Map

```
┌─────────────────────────────────────────────────────────────┐
│                    MIFEDHA PRODUCTS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PAL-PAL LOANS              CHAMA GROUPS                   │
│  ─────────────              ────────────                   │
│  • Friend-to-friend         • Community savings            │
│  • Flexible terms           • Shared investments           │
│  Screen: LnsScreen          Screen: ChamaScreen            │
│  Keywords: pal, loan,       Keywords: chama, group,        │
│            borrow, lend                  savings           │
│                                                             │
│  BUSINESS CREDIT            COMB                           │
│  ─────────────────          ────                           │
│  • B2B trade credit         • Buy-now-pay-later            │
│  • Later payment            • Flexible shopping            │
│  Screen: CredSlsScreen      Screen: COMB                   │
│  Keywords: credit, sales,   Keywords: comb, consume,       │
│            business, trade             bill, credit        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

All products support 13 languages:
en, ar, zh, ru, sw, fr, es, de, pt, it, he, hi, am
```

## 🔄 Language Switch Flow

```
User changes language in app
    ↓
i18n.language updated
    ↓
Chat automatically reflects new language
    ├─ UI strings update
    ├─ Bot responses in new language
    └─ Product info in new language
```

## 🎨 Color Scheme

```
Primary Colors:
┌──────────────┐
│ #e29d58      │  Orange-gold (header, buttons)
└──────────────┘

┌──────────────┐
│ #007AFF      │  Blue (user messages)
└──────────────┘

┌──────────────┐
│ #e8e8e8      │  Light gray (bot messages)
└──────────────┘

┌──────────────┐
│ #fff         │  White (text on colored bg)
└──────────────┘

┌──────────────┐
│ #333         │  Dark (text on light bg)
└──────────────┘

┌──────────────┐
│ #999         │  Medium gray (placeholder text)
└──────────────┘
```

## 📊 State Management

```
ChatBotContext
    │
    ├─ isOpen: boolean
    │   └─ Controls modal visibility
    │
    ├─ messages: ChatMessage[]
    │   ├─ { id, text, sender, timestamp }
    │   └─ Stores chat history
    │
    ├─ isLoading: boolean
    │   └─ Shows loading spinner
    │
    └─ Methods
        ├─ openChat()
        ├─ closeChat()
        ├─ addMessage()
        ├─ clearMessages()
        └─ setLoading()
```

## 🚀 Query Processing Pipeline

```
"What are the benefits of Pal-Pal?"
        ↓
toLowerCase()
        ↓
"what are the benefits of pal-pal?"
        ↓
Search keywords in productDatabase
        ↓
Match: pal → Pal-Pal Loans product
        ↓
Detect query type:
├─ Contains "benefit" → Show benefits
├─ Contains "about/what/tell" → Show about
├─ Contains "take/go/navigate" → Prepare navigation
└─ Default → Show description
        ↓
Get user's language
        ↓
Format response in user's language
        ↓
Generate bot message
        ↓
Display to user
```

## 🔌 Integration Points

```
App.tsx
    └─ <ChatBotProvider>
        
GlobalHeader.tsx
    └─ useChatBot() → openChat()
    
ChatBotModal.tsx
    └─ useChatBot() → messages, isOpen, etc.
    
productDatabase.ts
    └─ PRODUCTS, getProductsByKeyword()
    
RootNav/index.tsx
    └─ <ChatBotModal onNavigate={...} />
```

## 🌟 User Interaction Timeline

```
Time  Event                           State
────  ─────────────────────────────  ──────────────────
T0    App loads                      ChatBot closed
T1    User taps 🤖                   Modal opens, welcome shown
T2    User types "Tell me about COMB"  Input field active
T3    User presses Send              isLoading = true
T4    Bot processes query (800ms)    Processing...
T5    Bot response ready             isLoading = false
T6    Response displayed             Message history updated
T7    User clicks Clear              Messages cleared
T8    User clicks X                  Modal closed
T9    Back to normal app state       ChatBot state preserved
```

---

**Visual Reference Complete** ✓
