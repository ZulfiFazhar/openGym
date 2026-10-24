# Spec: Calorie Calculator & AI Nutrition Tracker

## 1. Background & Objectives
openGym is an offline-first fitness tracking PWA. Users currently track workouts, weights, routines, and body measurements. Nutrition and calorie intake are critical counterparts to strength and physique goals. This feature adds a complete Nutrition & Calorie Tracking subsystem to openGym:
1. **Interactive AI Step Wizard**: Step-by-step intake wizard to calculate Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), and daily calorie/macro targets based on physical metrics, activity level, gym history, and fitness goals.
2. **Food Logging with 3 Input Methods**:
   - Natural language text (e.g. "1 bowl of oatmeal with banana and honey").
   - Food dish photo analysis (AI multimodal vision estimating portion, calories, macros).
   - Snack barcode scanning (Open Food Facts API) with fallback to photo of Nutrition Facts table (AI Vision OCR).
3. **Home Screen Nutrition Summary Card**: Glassy, responsive card on the Home dashboard showing calories consumed vs. target, macro progress bars, quick-add food button, and wizard shortcut.
4. **Offline-first Local Persistence & Device Sync**: Nutrition logs and target settings are saved in user state and synced across devices using openGym's sync engine.

---

## 2. Architecture & Data Flow

### 2.1 Component Architecture
```
[ Home View ]
     │
     ├──> [ NutritionCard ] (Progress bar, kcal remaining, macro breakdown)
     │         │
     │         ├──> [ Open NutritionWizardModal ] (Step-by-step AI target calculation)
     │         │
     │         └──> [ Open FoodLoggerSheet ] (Today's log, meal categories)
     │                   │
     │                   ├──> [ AddFoodModal ]
     │                   │         ├── Mode A: Text Input (NLP)
     │                   │         ├── Mode B: Photo Capture (AI Vision)
     │                   │         └── Mode C: Barcode Scanner / Nutrition Label Photo
     │                   │
     │                   └──> [ FoodConfirmReview ] (Editable calorie & macro inputs before save)
```

### 2.2 Backend Endpoints
- `POST /api/nutrition/wizard`:
  - Accepts profile inputs (height, weight, age, gender, activity, workoutFrequency, goal, diet).
  - Uses the instance AI provider (`data/coach.json` config) with structured JSON prompt to calculate personalized calorie & macro recommendations with scientific reasoning.
- `POST /api/nutrition/analyze`:
  - Accepts text query (`{ query: string }`) OR image payload (`{ imageBase64: string, type: 'food' | 'label' }`).
  - Returns structured nutrition item: `{ name, calories, protein, carbs, fat, serving, confidence }`.
- `GET /api/nutrition/barcode/:code`:
  - Queries `https://world.openfoodfacts.org/api/v2/product/:code.json`.
  - Normalizes product name, calories (kcal), protein, carbs, and fat per serving or 100g.

---

## 3. Data Structures & State Management

### 3.1 Store State (`DEF` in `store/useStore.js`)
```typescript
interface NutritionTarget {
  calories: number;       // e.g. 2200
  protein: number;        // in grams e.g. 150
  carbs: number;          // in grams e.g. 230
  fat: number;            // in grams e.g. 65
  source: 'wizard' | 'manual';
  t: number;              // timestamp for sync conflict resolution
  profile?: {
    height: number;
    weight: number;
    age: number;
    gender: 'male' | 'female';
    activity: 'sedentary' | 'light' | 'moderate' | 'very_active';
    goal: 'cut' | 'maintain' | 'bulk';
    diet?: string;
  };
}

interface NutritionLogEntry {
  id: string;             // nanoid/timestamp random string
  d: string;              // date 'YYYY-MM-DD'
  t: number;              // timestamp
  name: string;           // e.g. 'Chicken Breast & Rice'
  calories: number;       // kcal
  protein: number;        // grams
  carbs: number;          // grams
  fat: number;            // grams
  serving?: string;       // e.g. '1 portion (200g)'
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  source: 'ai_text' | 'ai_photo' | 'barcode' | 'ai_label' | 'manual';
}

// In DEF:
nutritionTarget: null,
nutritionLogs: []
```

### 3.2 Sync Merging (`lib/sync-merge.js`)
- `nutritionLogs`: Merged by unique entry `id`, latest timestamp `t` wins.
- `nutritionTarget`: Merged by latest timestamp `t`.

---

## 4. AI Step Wizard Flow
- **Step 1: Metric Profile** (Height, Weight, Age, Biological Sex). Pre-filled from existing profile measurements if available.
- **Step 2: Lifestyle & Activity** (Sedentary, Lightly Active, Moderately Active, Very Active). Displays weekly gym frequency derived from past logged workouts in openGym.
- **Step 3: Primary Goal** (Fat Loss / Cut, Maintenance / Body Recomposition, Muscle Gain / Bulk) with surplus/deficit rate selector.
- **Step 4: Dietary Preferences** (High Protein, Balanced, Low Carb, Vegetarian, or Custom Notes).
- **Step 5: AI Generation & Review**:
  - Animated calculation state.
  - Result card with estimated BMR, TDEE, recommended daily calories, and macro breakdown.
  - Editable sliders/inputs if the user wants slight manual adjustments.
  - "Apply to My Target" action.

---

## 5. UI / UX Design & Styling
- Integrated into the existing openGym design system (Glassmorphism, dark/light theme tokens, fluid animations, safe area padding).
- Home screen summary card placed prominently without cluttering the 4-pill bottom navigation bar.
- Lightweight camera & barcode scanner integration using HTML5 `BarcodeDetector` API when available, with video element and canvas capture fallback.
