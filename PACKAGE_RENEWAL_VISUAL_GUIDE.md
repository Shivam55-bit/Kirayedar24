# Package Renewal Feature - Visual Guide

## 🎨 UI/UX Overview

### Renewal Modal - Full View

```
┌────────────────────────────────────────┐
│                                        │
│  ⚠️ Package Expired                   │  ← Red gradient header
│     Expired 5 days ago                │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  📅 Expired on: 25 Jan 2026           │  ← Info section
│                                        │
├────────────────────────────────────────┤
│                                        │
│  ✨ Benefits of Active Package:       │  ← Benefits section
│                                        │
│  ✅ Post unlimited properties         │
│  ✅ Reach thousands of buyers         │
│  ✅ Get instant notifications         │
│  ✅ Priority visibility               │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  Choose Your Package                  │  ← Package selection
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Basic Plan              ₹199   ○  │ │  ← Unselected
│  │ 30 days validity                  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Premium Plan            ₹449   ●  │ │  ← Selected
│  │ 90 days validity                  │ │     (highlighted)
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Pro Plan                ₹799    ○ │ │  ← Unselected
│  │ 365 days validity                 │ │
│  └──────────────────────────────────┘ │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  ℹ️ Your package has expired. Renew   │  ← Info banner
│     it now to continue posting        │
│     properties.                        │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  [Cancel]          [Renew Package]    │  ← Action buttons
│                                        │
└────────────────────────────────────────┘
```

## 🎭 User Flows

### Flow 1: Try to Post Property (Expired)

```
┌─────────────────┐
│  Add Sell Page  │
└────────┬────────┘
         │
         ↓
    ┌────────────┐
    │ Fill Details│
    └────┬───────┘
         │
         ↓
┌──────────────────────┐
│ Click Submit Property│
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│Check Subscription    │
│is_active? NO ✗       │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Show Renewal Modal           │
│ "Package Expired"            │
│ Package Selection ↓          │
│ Renew Package Button         │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────┐
│Select Package        │
│Click Renew Button    │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Payment Modal Opens  │
│ Select Payment Method│
│ Complete Payment     │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Package Renewed ✓    │
│ Property Posted ✓    │
└──────────────────────┘
```

### Flow 2: View My Properties (Expired)

```
┌─────────────────────┐
│My Properties Screen │
└────────┬────────────┘
         │
         ↓
┌──────────────────────┐
│ Screen Comes to Focus│
│ useFocusEffect Hook  │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│checkSubscriptionStatus│
│is_active? NO ✗       │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Auto-Show Renewal Modal      │
│ "Package Expired"            │
└──────┬───────────────────────┘
       │
       ├─ [Cancel] ──→ Back to Screen
       │
       └─ [Renew] ──→ Payment Modal
                        │
                        ↓
                   Package Renewed ✓
```

## 🎨 Color Scheme

### Header Gradient
```
Top:    #ff6b6b (Red)
Bottom: #ee5a6f (Darker Red)
Text:   #ffffff (White)
```

### Package Cards
```
Unselected:
  Background: #f9f9f9 (Light gray)
  Border:     #e0e0e0 (Gray)
  Text:       #333 (Dark)

Selected:
  Background: #fff8f0 (Light orange)
  Border:     #f39c12 (Orange)
  Shadow:     0 2px 8px rgba(243, 156, 18, 0.2)
```

### Buttons
```
Cancel Button:
  Border:     #ddd
  Text:       #666
  Background: #fff

Renew Button (Enabled):
  Background: #f39c12 (Orange)
  Text:       #fff
  Shadow:     0 3px 12px rgba(243, 156, 18, 0.3)

Renew Button (Disabled):
  Background: #ccc
  Text:       #fff
  Shadow:     none
```

### Status Indicators
```
Benefits:   ✅ #27ae60 (Green)
Warning:    ⚠️  #ff6b6b (Red)
Info:       ℹ️  #3498db (Blue)
Calendar:   📅 #f39c12 (Orange)
```

## 📱 Layout Dimensions

### Responsive Breakpoints
```
Mobile (< 768px):
  Modal height:      90% of screen
  Padding:          20px
  Font sizes:       14-24px

Tablet (≥ 768px):
  Modal height:      85% of screen
  Padding:          24px
  Font sizes:       16-26px

Desktop (≥ 1024px):
  Modal width:      500px
  Max width:        600px
  Padding:          28px
```

### Component Sizing
```
Header:              56px height
Package Card:        80px height (collapsed)
Button:              48px height (min touch target)
Icons:               20-32px size
Package Cards gap:   12px
Section spacing:     14-20px
```

## 🔤 Typography

### Font Sizes
```
Header Title:    24px, Bold 700
Subtitle:        14px, Regular 400
Section Title:   16px, Bold 700
Label:          14px, Bold 600
Text:           14px, Regular 400
Info:           13px, Regular 400
Price:          20px, Bold 800
Validity:       12px, Regular 500
```

### Font Weight
```
Light:     400
Regular:   500
Semibold:  600
Bold:      700
ExtraBold: 800
```

## 🎬 Animations

### Modal Entry
```
Animation:  slide-up
Duration:   300ms
Easing:     ease-out
```

### Package Selection
```
Animation:  fade + scale-up
Duration:   200ms
Easing:     ease-out
Transform:  scale(0.95) → scale(1)
Opacity:    0.8 → 1
```

### Button Press
```
Animation:  opacity
Duration:   100ms
Easing:     ease-in-out
Opacity:    1 → 0.7 → 1
```

### Loading Spinner
```
Animation:  rotate
Duration:   1s
Direction:  infinite
Color:      #f39c12
```

## 📏 Spacing

### Vertical Spacing (Padding/Margins)
```
Extra Small:  4px
Small:        8px
Medium:       12px
Large:        16px
Extra Large:  20px
Huge:         24-28px
```

### Horizontal Spacing
```
Edge padding: 16px (mobile), 20-24px (tablet)
Inner gaps:   8-12px
Column gap:   10px
Row gap:      12px
```

## 🖼️ Icons

### Ionicons Used
```
warning           - Alert/Warning sign
checkmark-circle  - Selected package
radio-button-off  - Unselected option
calendar          - Date display
information-circle- Info sections
refresh           - Renew action
close            - Close button
```

## 🎯 States

### Modal States
```
Closed:         Not visible
Opening:        Slide up animation
Open:           Fully visible
Package Select: Card highlights
Loading:        Spinner visible
Error:          Red alert shown
```

### Button States
```
Default:        Orange, enabled
Hover:          Slightly darker
Pressed:        Opacity 0.7
Disabled:       Gray, no interaction
Loading:        Spinner visible
```

## 📊 Responsive Adjustments

### Mobile (< 600px)
```
Modal width:      Full screen - 32px margin
Package cards:    Stack vertically
Button width:     Full width
Font scale:       -2px from base
Padding:         16px
```

### Tablet (600px - 1024px)
```
Modal width:      80% of screen
Package cards:    2 columns (if space)
Button width:     Flex layout
Font scale:       Base size
Padding:         20px
```

### Desktop (> 1024px)
```
Modal width:      500px centered
Package cards:    Grid layout
Button width:     Split 50/50
Font scale:       +2px from base
Padding:         24px
```

## 🎨 Dark Mode Support

### Future Enhancement (Dark Theme Colors)
```
Background:      #1a1a1a
Text Primary:    #fff
Text Secondary:  #ccc
Card:           #2a2a2a
Border:         #444
Accent:         #f39c12 (same)
```

## ♿ Accessibility Features

### Touch Targets
```
Minimum:       44x44px
Button:        Meets requirement (48px)
Card clickable:Meets requirement
```

### Contrast Ratios
```
Text on white:        7:1 (AAA standard)
Text on colored:      4.5:1 (AA standard)
Icon on background:   3:1 (minimum)
```

### Focus States
```
Keyboard:      2px outline, 2px offset
Color:         #f39c12
Active focus:  Clear visual indicator
```

---

## Visual Component Hierarchy

```
┌─────────────────────────────────┐
│     Modal Container             │  ← Full screen overlay
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │  Header (Gradient)        │  │  ← Red gradient bg
│  │  Icon + Title + Subtitle  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Expiry Info              │  │  ← Light gray bg
│  │  Calendar + Date Info     │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ScrollView               │  │  ← Scrollable content
│  │  ├─ Benefits Section      │  │
│  │  ├─ Packages Section      │  │
│  │  │  ├─ Package Card 1     │  │
│  │  │  ├─ Package Card 2     │  │
│  │  │  └─ Package Card 3     │  │
│  │  └─ Info Section          │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Footer (Actions)         │  │  ← Button container
│  │  [Cancel] [Renew Package] │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

---

**Design System Version:** 1.0
**Last Updated:** January 30, 2026
