# MiFedha AI Chat Navigator - Implementation Guide

## Overview
The AI Chat Navigator is a conversational interface integrated into the MiFedha app that helps users navigate to products and learn about their features. It's accessible from a robot icon in the global header, appears on every screen, and supports 13 languages.

## ✨ Features

### 1. **Persistent Navigation**
- Robot icon in top menu row of GlobalHeader (next to menu icon)
- Accessible from ANY screen in the app
- Does not block or interrupt navigation
- Respects account setup restrictions

### 2. **13-Language Support**
All UI strings and product information available in:
- English (en)
- Arabic (ar)
- Chinese (zh)
- Russian (ru)
- Swahili (sw)
- French (fr)
- Spanish (es)
- German (de)
- Portuguese (pt)
- Italian (it)
- Hebrew (he)
- Hindi (hi)
- Amharic (am)

### 3. **Smart Product Recognition**
The bot understands and responds to queries about:
- **Pal-Pal Loans** - Friend-to-friend lending
- **Chama Groups** - Community savings & investments
- **Credit Sales** - B2B trade credit
- **COMB** - Buy-now-pay-later

### 4. **Intelligent Responses**
Users can ask:
- "What is Pal-Pal?" → Detailed product description
- "What are the benefits?" → Bulleted benefits list
- "How does it help me?" → About/benefits info
- "Take me to Chama" → Product info + navigation
- "Tell me about COMB" → Comprehensive product overview

## 📁 File Structure

```
src/
├── contexts/
│   └── ChatBotContext.tsx          # State management
├── components/
│   └── ChatBotModal.tsx             # UI Component
├── utils/
│   └── productDatabase.ts           # Product data & translations
└── componentx/
    └── GlobalHeader.tsx             # Updated with chat icon

navigation/
└── RootNav/
    └── index.tsx                    # Modal integration

App.tsx                               # ChatBotProvider wrapper
```

## 🔧 Implementation Details

### 1. ChatBotContext (State Management)
```typescript
// Usage in any component
const { isOpen, messages, openChat, closeChat, addMessage } = useChatBot();
```

**Methods:**
- `openChat()` - Opens chat modal
- `closeChat()` - Closes chat modal
- `addMessage(text, sender)` - Add message ('user' or 'bot')
- `clearMessages()` - Clear all messages
- `setLoading(boolean)` - Show loading indicator

### 2. ChatBotModal Component
The full-screen modal that displays:
- Welcome message (first open)
- Message history
- Input field
- Send/Clear buttons
- Language-specific UI

**Props:**
```typescript
interface ChatBotModalProps {
  onNavigate?: (screenName: string) => void; // Callback for navigation
}
```

### 3. Product Database
**Location:** `src/utils/productDatabase.ts`

**Structure:**
```typescript
interface ProductInfo {
  id: string;                      // Unique ID
  screen: string;                  // Navigation target
  keywords: string[];              // Search keywords
  description: Record<string, string>;    // 13 languages
  benefits: Record<string, string[]>;     // 13 languages
  aboutProduct: Record<string, string>;   // 13 languages
}
```

**Current Products:**
```
1. pal-pal-loans      → LnsScreen
2. chama-groups       → ChamaScreen
3. business-credit    → CredSlsScreen
4. comb               → COMB
```

### 4. GlobalHeader Integration
The chat icon is positioned in the top-left menu row:

```typescript
<View style={styles.menuRow}>
  <TouchableOpacity onPress={openDrawer}>
    <Ionicons name="menu" size={28} color="#fff" />
  </TouchableOpacity>
  
  <TouchableOpacity onPress={handleChatPress}>
    <MaterialCommunityIcons name="robot" size={24} color="#fff" />
  </TouchableOpacity>
</View>
```

**Layout:**
```
┌─────────────────────────────────────────────┐
│ ☰ 🤖           Welcome, John        Sign Out │  ← MenuRow + ActionRow
└─────────────────────────────────────────────┘
```

## 🚀 How to Use

### For Users
1. Click the robot icon (🤖) in the top-left of any screen
2. Chat modal opens
3. Type a question about products (e.g., "Tell me about Pal-Pal")
4. Bot responds with product information in your language
5. Close by clicking X or continue chatting

### For Developers

#### Add a New Product
1. Open `src/utils/productDatabase.ts`
2. Add entry to `PRODUCTS` array:

```typescript
{
  id: 'new-product',
  screen: 'NewProductScreen',  // Navigation target
  keywords: ['keyword1', 'keyword2'],
  description: {
    en: 'Product description in English',
    ar: 'وصف المنتج بالعربية',
    // ... 11 more languages
  },
  benefits: {
    en: ['Benefit 1', 'Benefit 2', ...],
    ar: ['الفائدة 1', 'الفائدة 2', ...],
    // ... 11 more languages
  },
  aboutProduct: {
    en: 'About this product...',
    ar: 'عن هذا المنتج...',
    // ... 11 more languages
  }
}
```

3. The bot will automatically recognize it

#### Connect to Real AI Backend
1. Replace the simulated response in `ChatBotModal.tsx`:

```typescript
// Current: simulated with 800ms delay
await new Promise(resolve => setTimeout(resolve, 800));

// Replace with:
const response = await fetch('https://your-ai-backend.com/chat', {
  method: 'POST',
  body: JSON.stringify({
    query,
    language: lang,
    context: 'mifedha-products'
  })
});
const result = await response.json();
botResponse = result.message;
navigateProduct = result.screenName;
```

#### Handle Navigation After Chat
The `ChatBotModal` accepts an `onNavigate` callback:

```typescript
<ChatBotModal onNavigate={(screenName) => {
  navigation.navigate(screenName);
}} />
```

## 🎨 Styling & Customization

### Chat Icon Styling
Edit in `src/componentx/GlobalHeader.tsx`:
```typescript
<TouchableOpacity
  onPress={handleChatPress}
  style={[styles.chatButton, restrictNavigation && styles.disabledButton]}
>
  <MaterialCommunityIcons 
    name="robot"         // Icon name
    size={24}            // Icon size
    color="#fff"         // Icon color
  />
</TouchableOpacity>
```

### Modal Styling
Edit `src/components/ChatBotModal.tsx` `styles` object:
- `container` - Full modal background
- `header` - Top bar with title
- `messageBubble` - User/bot message styling
- `inputContainer` - Bottom input area
- `sendButton` - Send button appearance

### Colors
- Header: `#e29d58` (theme color)
- User messages: `#007AFF` (blue)
- Bot messages: `#e8e8e8` (light gray)
- Text: `#fff` (white on colored)

## 🌐 Multi-Language Support

### How It Works
1. Current language from `i18n.language`
2. Fallback to English if language not supported
3. All product data has all 13 translations

### Adding a Language
1. Extend `chatTranslations` in `ChatBotModal.tsx`:
```typescript
const chatTranslations: Record<string, ChatTranslations> = {
  // ... existing languages
  ja: {  // Japanese
    title: 'MiFedha ナビゲーター',
    placeholder: '製品について聞いてください...',
    // ... all other keys
  }
}
```

2. Add to `productDatabase.ts`:
```typescript
description: {
  en: 'English description',
  ja: '日本語での説明',
  // ... other languages
}
```

## 📊 Query Processing Logic

The bot uses keyword matching to find products:

```
User Query
    ↓
Convert to lowercase
    ↓
Search productDatabase keywords
    ↓
If match found:
  - Detect query type (benefits/about/navigate)
  - Format appropriate response
  - Return product info in user's language
    ↓
Else:
  - Return "no match" message
```

## 🔒 Security & Restrictions

The chat respects the account setup guard:
```typescript
if (restrictNavigation) {
  Alert.alert(
    'Complete Account Setup',
    'Please complete your main account setup first'
  );
  return;
}
```

This prevents navigation if:
- Main account not created
- Profile not loaded
- Sensitive operations in progress

## 📱 Responsive Design

The modal adapts to screen size:
- `screenHeight` used for layout calculations
- Message bubbles max-width: 85% of screen
- Scrollable message area
- Bottom-sticky input field

## ✅ Testing Checklist

- [ ] Chat icon appears in header on all screens
- [ ] Click icon opens chat modal
- [ ] Modal closes with X button
- [ ] Message history persists while modal open
- [ ] Messages scroll to latest
- [ ] Send button works with Enter key
- [ ] Clear button wipes message history
- [ ] All 13 languages display correctly
- [ ] Product queries are recognized
- [ ] Bot responds with appropriate info
- [ ] Respects restrictNavigation guard
- [ ] No TypeScript compilation errors

## 🐛 Troubleshooting

### Chat icon not visible
- Check `src/componentx/GlobalHeader.tsx` menuRow
- Verify `useChatBot` hook is imported
- Ensure `ChatBotProvider` wraps app in `App.tsx`

### Messages not appearing
- Check browser console for errors
- Verify `ChatBotContext` is properly initialized
- Ensure modal is rendering in `RootNav`

### Language not translating
- Add language to `chatTranslations` object
- Add language to product `description`/`benefits`/`aboutProduct`
- Check `i18n.language` value matches translation key

### Navigation not working
- Implement `onNavigate` callback in `RootNav`
- Verify screen names in `productDatabase.ts` exist
- Check navigation stack for screen registration

## 🚀 Performance Optimization

### Current Implementation
- Messages stored in React state (suitable for current chat length)
- Keyword search is O(n*m) (suitable for small product DB)

### For Large Scale
1. **Message Pagination**
   ```typescript
   // Load older messages on scroll up
   const [messages, setMessages] = useState(recentMessages);
   ```

2. **Indexed Search**
   ```typescript
   // Use product index for faster lookup
   const productIndex = new Map(PRODUCTS.map(p => [p.id, p]));
   ```

3. **Memoization**
   ```typescript
   const memoizedProducts = useMemo(() => 
     getProductsByKeyword(query), [query]
   );
   ```

## 📚 Related Files
- `src/i18n/` - Internationalization setup
- `src/contexts/` - Other context providers
- `navigation/` - Navigation structure
- `types.tsx` - TypeScript type definitions

## 🎓 Learning Resources
- React Context: https://react.dev/reference/react/useContext
- React Native Modal: https://reactnative.dev/docs/modal
- i18next: https://www.i18next.com/
- Navigation: https://reactnavigation.org/

---

**Last Updated:** 2026-08-09  
**Version:** 1.0  
**Status:** Production Ready
