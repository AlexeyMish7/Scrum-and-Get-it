---
applyTo: "**"
---

# Theme Design & Styling Instructions — Scrum-and-Get-it

**Purpose**  
Guide Copilot to consistently apply the sleek, techy design system when updating components and styling throughout the React + MUI application.

**Project Context**

- Frontend: React + TypeScript + Vite + Material-UI v5
- Design Language: Glass morphism with techy aesthetic
- Theme File: `frontend/src/theme/theme.tsx` (comprehensive design system)
- Color Palette: Modern blues, indigos, with gradient accents
- Typography: Inter/Manrope geometric sans-serif fonts
- Animation: Smooth, GPU-accelerated micro-interactions

---

## Core Design Principles

### 1. Glass Morphism First

- **Always prefer glass effects** over solid backgrounds
- Use `theme.designTokens.surfaces.glass` for standard surfaces
- Apply `backdrop-filter: blur()` for depth and layering
- Subtle borders with `theme.designTokens.surfaces.border`

### 2. Gradient Accents (Not Overuse)

- **Sparingly use gradients** for primary actions and headers
- `theme.designTokens.gradients.primary` for main CTAs
- `theme.designTokens.gradients.techy` for hero elements
- Never stack multiple gradients in the same view

### 3. Consistent Elevation & Shadows

- Use MUI elevation levels: 0 (none), 1 (subtle), 2 (medium), 3 (floating)
- `theme.designTokens.shadows.surface` for standard cards
- `theme.designTokens.shadows.glow` for primary actions
- `theme.designTokens.shadows.focus` for accessibility

### 4. Smooth Micro-Interactions

- `theme.designTokens.animation.smooth` for standard transitions
- `theme.designTokens.animation.bounce` for button interactions
- Always include hover/focus states
- `transform: translateY(-2px)` for lift effects

---

## Component Styling Rules

### When Updating Existing Components

#### 1. Remove Inline Styles & sx Props

```tsx
// ❌ AVOID: Manual styling
<Box sx={{
  backgroundColor: 'rgba(255,255,255,0.9)',
  borderRadius: 2,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
}}>

// ✅ PREFER: Helper classes or theme tokens
<Box className="glass-card">
// OR for custom components:
<Box sx={{
  background: theme.designTokens.surfaces.glass,
  borderRadius: '16px',
  boxShadow: theme.designTokens.shadows.surface
}}>
```

#### 2. Standardize Button Variants

```tsx
// ❌ AVOID: Default or manual button styling
<Button color="primary">Submit</Button>
<Button sx={{ background: 'blue' }}>Submit</Button>

// ✅ PREFER: Semantic variants
<Button variant="primary">Submit Application</Button>
<Button variant="glass">View Details</Button>
<Button variant="glow">Get Started</Button>
<Button variant="destructive">Delete Account</Button>
```

#### 3. Use Helper Classes for Common Patterns

```tsx
// ✅ Standard patterns
.glass-card           // Standard glass morphism card
.floating-container   // Elevated glass container with padding
.tech-border         // Gradient border effect
.techy-gradient      // Multi-color gradient text
.glow-text          // Glowing text for status/highlights
.status-indicator    // Colored dot indicators
```

#### 4. Replace Custom CSS Files

When encountering component-specific CSS files:

- **Audit if still needed** - many effects are now in the theme
- **Consolidate similar patterns** into helper classes
- **Remove redundant glass/shadow effects** - let theme handle it
- **Keep only unique component logic** (animations, specific layouts)

### Form Component Standards

#### Input Fields

```tsx
// ✅ Standard approach - theme handles glass effects automatically
<TextField
  label="Field Label"
  variant="outlined"
  fullWidth
  placeholder="Enter value..."
/>

// ✅ For custom styling, use design tokens
<TextField
  sx={{
    '& .MuiOutlinedInput-root': {
      background: theme.designTokens.surfaces.glass,
      backdropFilter: theme.designTokens.blur.sm,
    }
  }}
/>
```

#### Select Dropdowns

```tsx
// ✅ Standard select with enhanced theming
<FormControl fullWidth>
  <InputLabel>Select Option</InputLabel>
  <Select label="Select Option">
    <MenuItem value="option1">Option 1</MenuItem>
    <MenuItem value="option2">Option 2</MenuItem>
  </Select>
</FormControl>
```

### Card & Container Standards

#### Standard Cards

```tsx
// ✅ Use MUI elevation system
<Card elevation={1}>           // Subtle glass card
<Card elevation={2}>           // Medium emphasis
<Card elevation={3}>           // High emphasis/floating

// ✅ Add tech border for special content
<Card elevation={2} className="tech-border">
```

#### Layout Containers

```tsx
// ✅ For major content sections
<Box className="floating-container">
  <Typography variant="h4">Section Title</Typography>
  {/* content */}
</Box>

// ✅ For standard content grouping
<Box className="glass-card">
  {/* content */}
</Box>
```

### Typography Standards

#### Headings

```tsx
// ✅ Hero/main headings with gradient
<Typography variant="h1" className="techy-gradient">
  Welcome to ATS Tracker
</Typography>

// ✅ Section headings (standard)
<Typography variant="h2">Dashboard Overview</Typography>
<Typography variant="h3">Recent Applications</Typography>
```

#### Status & Highlight Text

```tsx
// ✅ For system status, online indicators
<Typography className="glow-text">System Online</Typography>

// ✅ For important status messages
<Typography variant="h6" className="glow-text">
  Profile Complete
</Typography>
```

---

## Design Token Usage Guide

### Accessing Design Tokens

```tsx
// ✅ In sx props or styled components
sx={{
  background: theme.designTokens.gradients.primary,
  boxShadow: theme.designTokens.shadows.glow,
  backdropFilter: theme.designTokens.blur.md,
  transition: theme.designTokens.animation.smooth,
}}
```

### Common Token Combinations

```tsx
// ✅ Glass morphism surface
{
  background: theme.designTokens.surfaces.glass,
  backdropFilter: theme.designTokens.blur.md,
  border: `1px solid ${theme.designTokens.surfaces.border}`,
  borderRadius: '16px',
  boxShadow: theme.designTokens.shadows.surface,
}

// ✅ Primary action button
{
  background: theme.designTokens.gradients.primary,
  boxShadow: theme.designTokens.shadows.glow,
  transition: theme.designTokens.animation.smooth,
  '&:hover': {
    background: theme.designTokens.gradients.primaryHover,
    boxShadow: theme.designTokens.shadows.glowHover,
    transform: 'translateY(-2px)',
  }
}
```

---

## Color Usage Guidelines

### Primary Colors (Use Thoughtfully)

- **Blue (#3b82f6)**: Main brand color, primary actions, links
- **Indigo (#6366f1)**: Secondary actions, accents
- **Orange (#f97316)**: Tertiary actions, call-outs

### Semantic Colors

- **Success (#10b981)**: Confirmations, success states, positive feedback
- **Warning (#f59e0b)**: Cautions, warnings, pending states
- **Error (#ef4444)**: Errors, destructive actions, validation failures
- **Info (#06b6d4)**: Information, neutral actions, help text

### Text Colors

- **Primary (#0f172a)**: Main headings, important text
- **Secondary (#475569)**: Body text, descriptions
- **Disabled (#94a3b8)**: Disabled states, placeholders

---

## Responsive Design Standards

### Breakpoint Strategy

- **Mobile-first**: Start with mobile layout, enhance upward
- **Helper classes**: `.mobile-only`, `.desktop-only`, `.tablet-only`
- **MUI breakpoints**: `xs`, `sm`, `md`, `lg`, `xl`

### Spacing & Layout

```tsx
// ✅ Responsive spacing
<Box sx={{
  p: { xs: 2, sm: 3, md: 4 },           // Responsive padding
  mb: { xs: 3, md: 4 },                 // Responsive margin
  maxWidth: { xs: '100%', md: '1200px' } // Responsive width
}}>
```

### Typography Scaling

- Typography is **automatically responsive** via `responsiveFontSizes()`
- Use `clamp()` in custom components for fine control
- Maintain hierarchy across all screen sizes

---

## Anti-Patterns to Avoid

### ❌ Don't Do This

```tsx
// Hard-coded colors
sx={{ backgroundColor: '#ffffff', color: '#000000' }}

// Inconsistent shadows
sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}

// Manual glass effects
sx={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}

// Inconsistent border radius
sx={{ borderRadius: '8px' }}  // Should be 12px or 16px

// Manual animations
sx={{ transition: 'all 0.2s ease' }}  // Use design tokens
```

### ✅ Do This Instead

```tsx
// Use theme colors
sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}

// Use design token shadows
sx={{ boxShadow: theme.designTokens.shadows.surface }}

// Use helper classes
<Box className="glass-card">

// Use consistent border radius
sx={{ borderRadius: '16px' }}  // or use helper classes

// Use design token animations
sx={{ transition: theme.designTokens.animation.smooth }}
```

---

## Component Update Workflow

### When Touching Any Component:

1. **Audit existing styling** - Can it use helper classes?
2. **Check for manual glass effects** - Replace with theme
3. **Standardize button variants** - Use semantic variants
4. **Apply design tokens** - Replace hard-coded values
5. **Add hover/focus states** - Enhance interactivity
6. **Test responsiveness** - Verify mobile/desktop
7. **Verify accessibility** - Focus indicators, contrast

### Update Priority:

1. **High Impact**: Buttons, cards, main navigation
2. **Medium Impact**: Forms, alerts, status indicators
3. **Low Impact**: Fine-tuning, micro-interactions

---

## Resources & References

- **Theme File**: `frontend/src/theme/theme.tsx`
- **Design Guide**: `frontend/src/theme/DESIGN_SYSTEM_GUIDE.md`
- **Component Examples**: `frontend/src/theme/DesignSystemShowcase.tsx`
- **Migration Guide**: `frontend/src/theme/MIGRATION_SUMMARY.md`

---

## Key Reminders

- **Glass morphism is the foundation** - use it consistently
- **Gradients are accents** - don't overuse them
- **Animation enhances UX** - make interactions feel smooth
- **Accessibility is non-negotiable** - maintain focus indicators and contrast
- **Mobile-first responsive** - design works on all devices
- **Performance matters** - use GPU-accelerated properties

---

_Apply these principles consistently to maintain the sleek, techy aesthetic while ensuring excellent usability and performance._
