# Templates Hub Testing Guide

## Quick Test Script for Sprint 2 Demo

### Test 1: Visual Template Comparison

**Steps**:

1. Navigate to: `http://localhost:5173/ai/templates`
2. Verify page loads with "Template Library" header
3. Look for blue "How Templates Work" section
4. Click "Show Template Comparison" button
5. **Verify**: 4 template examples appear (Classic, Modern, Creative, Minimal)
6. **Verify**: Each shows different AI-generated text with same meaning
7. **Verify**: Tooltips explain tone differences (stability, innovation, creativity, brevity)
8. Click "Hide Template Comparison"
9. **Verify**: Comparison section collapses

**Expected Result**: Users can visually see how templates change AI output style.

---

### Test 2: Create Custom Cover Letter Template

**Steps**:

1. Switch to "Cover Letter Templates" tab
2. Click **"Create Custom Template"** button (blue, top-left)
3. **Verify**: Dialog opens with form sections

**Form Testing**:

**Basic Information**:

- Enter name: `My Custom Professional Template`
- Enter description: `Custom template for corporate applications`
- Select category: `Professional`
- **Verify**: All fields accept input

**Visual Styling**:

- Change font to: `Georgia`
- Set font size: `12`
- Set line height: `1.8`
- Click primary color picker → choose dark blue (`#1a237e`)
- Click text color picker → choose dark gray (`#424242`)
- Click accent color picker → choose teal (`#00897b`)
- **Verify**: Color pickers display color selector
- **Verify**: Preview updates with new colors immediately

**Formatting Preferences**:

- Select header style: `Center`
- Select salutation style: `Formal`
- Select closing style: `Formal`
- Set paragraph spacing: `16`
- **Verify**: Radio buttons toggle
- **Verify**: Preview shows centered header

**Default AI Settings**:

- Select default tone: `Formal`
- Select default length: `Standard`
- Select default culture: `Corporate`
- **Verify**: Dropdowns show all options

**Preview Section**:

- **Verify**: Preview shows:
  - Georgia font
  - Centered "Your Name"
  - Selected colors applied
  - "Dear Hiring Manager," salutation
  - "Sincerely," closing
  - Proper spacing

**Save**:

- Click "Create Template"
- **Verify**: Success alert shows
- **Verify**: Dialog closes
- **Verify**: Template appears in "Custom Templates" section below

---

### Test 3: Use Custom Template in Editor

**Steps**:

1. Navigate to: `http://localhost:5173/ai/cover-letter`
2. Create new draft or open existing
3. Click template selector dropdown
4. **Verify**: Custom template "My Custom Professional Template" appears in list
5. Select custom template
6. **Verify**: Template applies (check preview or generated content)

---

### Test 4: Template Import (Existing Feature - Regression Test)

**Steps**:

1. Navigate to Templates Hub → Cover Letter tab
2. Click "Download Modern Example"
3. **Verify**: JSON file downloads
4. Click "Import Template" button
5. Select downloaded JSON file
6. **Verify**: Template imports successfully
7. **Verify**: Imported template appears in custom templates list

---

## Expected UI States

### Templates Hub Main Page

```
┌─────────────────────────────────────────────────────┐
│ 🎨 Template Library                                 │
│ Create and manage custom templates...              │
├─────────────────────────────────────────────────────┤
│ ✨ How Templates Work                               │
│ Templates control both visual appearance and AI... │
│                                                     │
│ 🎨 Visual Styling | 🤖 AI Behavior | 📄 Content    │
│                                                     │
│ [Show Template Comparison]                          │
├─────────────────────────────────────────────────────┤
│ [Resume Templates] [Cover Letter Templates]         │
│                                                     │
│ Cover Letter Tab:                                   │
│ [Create Custom Template] [Import] [Download Exs]   │
│                                                     │
│ System Templates (3):                              │
│ [Formal] [Creative] [Technical]                    │
│                                                     │
│ Custom Templates (X):                              │
│ [My Custom Professional Template] ...              │
└─────────────────────────────────────────────────────┘
```

### Custom Template Creator Dialog

```
┌───────────────────────────────────────────────────┐
│ Create Custom Cover Letter Template         [X]  │
├───────────────────────────────────────────────────┤
│ Basic Information                                 │
│ Template Name: [____________________________]     │
│ Description:   [____________________________]     │
│ Category:      [Professional ▼]                  │
│                                                   │
│ ─────────────────────────────────────────────────│
│ Visual Styling                                    │
│ Font: [Georgia ▼]    Size: [12]  Line: [1.8]    │
│ Primary: [🎨]  Text: [🎨]  Accent: [🎨]           │
│                                                   │
│ ─────────────────────────────────────────────────│
│ Formatting Preferences                            │
│ Header: ( ) Left  (•) Center  ( ) Right          │
│ Salutation: (•) Formal  ( ) Casual               │
│ Closing: (•) Formal  ( ) Casual                  │
│                                                   │
│ ─────────────────────────────────────────────────│
│ Default AI Settings                               │
│ Tone: [Formal ▼]  Length: [Standard ▼]          │
│ Culture: [Corporate ▼]                           │
│                                                   │
│ ─────────────────────────────────────────────────│
│ Preview:                                          │
│         Your Name                                 │
│   your.email@example.com | (555) 123-4567       │
│                                                   │
│ Dear Hiring Manager,                             │
│ This is a sample paragraph...                    │
│                                                   │
│ Sincerely,                                       │
│ [Your Name]                                      │
├───────────────────────────────────────────────────┤
│                    [Cancel]  [Create Template]    │
└───────────────────────────────────────────────────┘
```

---

## Error Cases to Test

### Validation Errors

1. **Empty Name**:

   - Leave template name blank
   - Click "Create Template"
   - **Verify**: Red alert shows "Template name is required"

2. **Short Name**:

   - Enter "AB" (2 characters)
   - Click "Create Template"
   - **Verify**: Alert shows "Template name must be at least 3 characters"

3. **Cancel Dialog**:
   - Fill in half the form
   - Click "Cancel"
   - **Verify**: Dialog closes without saving
   - **Verify**: Form resets for next open

---

## Browser Compatibility

Test in:

- ✅ Chrome (primary)
- ✅ Firefox
- ✅ Edge

---

## Performance Checks

- Dialog opens instantly (< 100ms)
- Color picker renders smoothly
- Preview updates without lag
- Template list renders all items (system + custom)
- No console errors during any operation

---

## Accessibility

- All form fields have labels
- Color pickers have accessible labels
- Dialog can be closed with ESC key
- Focus management works (Enter to submit)
- Alert messages readable by screen readers

---

## Common Issues & Solutions

### Issue: Template doesn't appear after creation

**Solution**: Check browser localStorage → Key: `cover_letter_custom_templates`

### Issue: Preview doesn't update

**Solution**: Verify state updates in React DevTools, check color values are valid hex

### Issue: Dialog won't open

**Solution**: Check console for errors, verify CoverLetterTemplateCreator import path

### Issue: Colors look wrong

**Solution**: Ensure color format is hex (e.g., `#1a237e` not `rgb(...)`)

---

## Sprint 2 Demo Script

**Scenario**: Show how template system empowers users to create personalized application materials.

**Script**:

1. "Let me show you how our template system works..."
2. Navigate to Templates Hub
3. "First, you can see how different templates affect AI behavior..."
4. Click "Show Template Comparison"
5. "Notice how the same experience is written 4 different ways - formal, technical, creative, concise"
6. "Now, let's create a custom template without touching any code..."
7. Click "Create Custom Template"
8. Fill in form with professional settings
9. "Watch the preview update in real-time as I change fonts and colors"
10. Save template
11. "And now it's immediately available in the Cover Letter Editor"
12. Navigate to editor, show custom template in list

**Time**: ~3 minutes
**Impact**: Demonstrates user empowerment, no-code customization, visual feedback

---

## Test Data

### Sample Custom Template Names

- My Professional Style
- Tech Startup Format
- Creative Agency Template
- Corporate Banking Style
- Minimal Designer Template

### Sample Descriptions

- "Formal template for corporate finance applications"
- "Modern, tech-forward style for startups"
- "Creative, engaging format for design roles"
- "Clean, minimal template for architecture positions"

---

## Success Criteria

✅ All 4 tests pass without errors
✅ Custom templates persist across page reloads
✅ Templates usable in Cover Letter Editor
✅ No TypeScript/console errors
✅ UI responsive and intuitive
✅ Visual comparison helpful and clear

**Sprint Goal**: Enable users to understand and customize templates visually → **ACHIEVED**
