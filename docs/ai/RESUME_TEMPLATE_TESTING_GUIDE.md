# Resume Template Selection - Testing Guide

**Purpose**: Verify unified template selection works correctly across all entry points
**Related**: `RESUME_TEMPLATE_UNIFICATION.md`

## Quick Verification Checklist

### ✅ Pre-Test Setup

- [ ] Frontend dev server running (`cd frontend; npm run dev`)
- [ ] Logged in to application
- [ ] Navigate to AI workspace

---

## Test Suite

### Test 1: ResumeStarter Template Selection

**Steps:**

1. Navigate to `/ai/resume`
2. Click **"Create New Resume"** button
3. Observe template selection dialog

**Verify:**

- [ ] Dialog shows "Choose Template" heading
- [ ] Helper text explains templates control visual + AI behavior
- [ ] 💡 Educational tip visible about AI guidance
- [ ] All **5 templates** visible:
  - [ ] Classic Professional
  - [ ] Modern Tech
  - [ ] Minimal Clean
  - [ ] Creative Bold
  - [ ] Academic CV
- [ ] Each template card shows:
  - [ ] Category badge (professional/creative/minimal/academic)
  - [ ] Template name
  - [ ] Full description (3+ sentences)
  - [ ] Font preview (actual template font displayed)
  - [ ] Sample bullet point in template style
- [ ] Radio button reflects selection
- [ ] Border color changes on selection (primary color)
- [ ] Grid responsive (3 columns on desktop)

**Create Draft:** 4. Enter name: "Test Modern Resume" 5. Select **"Modern Tech"** template 6. Click "Create & Start Editing"

**Verify:**

- [ ] Draft created successfully
- [ ] Navigates to editor
- [ ] Editor shows "Modern Tech" template applied

---

### Test 2: New Draft Dialog Template Selection

**Steps:**

1. In ResumeEditorV2, click **"+ New Draft"** button (top toolbar)
2. Observe template selection in dialog

**Verify:**

- [ ] **Identical UI** to ResumeStarter template selection
- [ ] Same helper text and educational tip
- [ ] All 5 templates visible
- [ ] Same descriptions as ResumeStarter
- [ ] Same visual layout and styling

**Create Draft:** 3. Enter name: "Test Academic CV" 4. Select **"Academic CV"** template 5. Click "Create Draft"

**Verify:**

- [ ] Draft created successfully
- [ ] Template applied is "Academic CV"
- [ ] Can switch between drafts

---

### Test 3: Template Descriptions Accuracy

**For each template, verify description explains:**

#### Classic Professional

- [ ] "Traditional format" mentioned
- [ ] Target industries: Finance, Law, Government, Healthcare
- [ ] AI behavior: Formal tone, proven results, industry-standard terminology

#### Modern Tech

- [ ] "Clean, contemporary" design mentioned
- [ ] Target: Software Engineering, Product Management, Data Science
- [ ] AI behavior: Innovation, technical achievements, quantifiable impact

#### Minimal Clean

- [ ] "Minimalist design" mentioned
- [ ] Target: Consulting, Operations, General Management
- [ ] AI behavior: Clarity, conciseness, essential information

#### Creative Bold

- [ ] "Eye-catching design" mentioned
- [ ] Target: Design, Marketing, Creative Direction, UX/UI
- [ ] AI behavior: Creativity, storytelling, portfolio work

#### Academic CV

- [ ] "Formal CV format" mentioned
- [ ] Target: Research, Academia, Science, PhD roles
- [ ] AI behavior: Publications, research contributions, scholarly achievements

---

### Test 4: Template Visual Styling

**Steps:**

1. Create draft with **"Creative Bold"** template
2. Generate some content (or use placeholder)
3. Observe editor styling

**Verify Creative Template Style:**

- [ ] Font family: Georgia (visible in content)
- [ ] Primary color: Purple (#7c3aed)
- [ ] Bullet style: "◦" (hollow circles)
- [ ] Section headers: Capitalized (not uppercase)

**Repeat for Modern Tech:**

- [ ] Font family: Calibri
- [ ] Primary color: Blue (#2563eb)
- [ ] Bullet style: "→" (arrows)
- [ ] Section headers: Uppercase

---

### Test 5: Template Flow to Database

**Steps:**

1. Create draft with **"Minimal Clean"** template
2. Open browser DevTools → Network tab
3. Filter for "resume_drafts" requests

**Verify:**

- [ ] POST request to create draft includes `template_id: "minimal"`
- [ ] Database row stores correct template ID
- [ ] On reload, draft loads with correct template

**SQL Verification (if possible):**

```sql
SELECT id, name, template_id FROM resume_drafts
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC LIMIT 1;
```

- [ ] `template_id` column = "minimal"

---

### Test 6: AI Generation with Template

**Steps:**

1. Create draft with **"Modern Tech"** template
2. Link to a tech job (e.g., "Senior Software Engineer")
3. Generate resume content using AI

**Verify AI Output:**

- [ ] AI generates tech-focused language
- [ ] Emphasizes innovation and technical achievements
- [ ] Uses modern tech terminology
- [ ] Quantifiable metrics included
- [ ] Tone matches "Modern Tech" style

**Compare with Classic:** 4. Create draft with **"Classic Professional"** template 5. Link to same job 6. Generate resume content

**Verify AI Output:**

- [ ] AI generates formal, traditional language
- [ ] More conservative tone than Modern Tech
- [ ] Industry-standard terminology
- [ ] Proven results emphasized

---

### Test 7: Template Hub Consistency

**Steps:**

1. Navigate to `/ai/templates`
2. Find Resume Templates section

**Verify:**

- [ ] Shows same 5 resume templates
- [ ] Template names match TemplateSelector
- [ ] Template IDs match (`classic`, `modern`, `minimal`, `creative`, `academic`)
- [ ] Descriptions consistent with TemplateSelector

---

### Test 8: Template Persistence Across Sessions

**Steps:**

1. Create draft with **"Creative Bold"** template
2. Note draft ID/name
3. Refresh page (F5)
4. Navigate back to resume editor
5. Load the same draft

**Verify:**

- [ ] Draft loads with correct template ("Creative Bold")
- [ ] Template styling preserved
- [ ] No template ID lost or reset to default

---

### Test 9: Custom Templates Support

**Steps:**

1. Open browser console
2. Add a custom template to localStorage:

```javascript
const customTemplate = {
  id: "my-custom",
  name: "My Custom Template",
  type: "chronological",
  colors: { primary: "#FF5733", accent: "#C70039", bg: "#FFFFFF" },
  font: "Helvetica",
  layout: "single",
  createdAt: new Date().toISOString(),
};

const existing = JSON.parse(
  localStorage.getItem("sgt:resume_templates") || "[]"
);
existing.push(customTemplate);
localStorage.setItem("sgt:resume_templates", JSON.stringify(existing));
```

3. Refresh page
4. Open "Create New Resume" dialog

**Verify:**

- [ ] Custom template appears in "CUSTOM TEMPLATES" section
- [ ] Shows "Custom" badge
- [ ] Displays template name and basic details
- [ ] Can select custom template
- [ ] Draft created with custom template ID

---

### Test 10: Edge Cases

#### No Template Selected (Default)

1. Open "Create New Resume" dialog
2. Don't select any template explicitly
3. Create draft

**Verify:**

- [ ] Default template applied ("modern" based on code)
- [ ] Draft created successfully

#### Switching Templates

1. Create draft with "Classic" template
2. Generate some content
3. Use template switcher (if available in editor)
4. Change to "Modern" template

**Verify:**

- [ ] Template changes successfully
- [ ] Content preserved
- [ ] Visual styling updates
- [ ] Database updated with new template_id

#### Invalid Template ID

1. Manually set template_id in database to "invalid_id"
2. Load draft

**Verify:**

- [ ] Graceful fallback to default template
- [ ] No crash or error
- [ ] User notified of invalid template (optional)

---

## Success Criteria

All tests pass with:

- ✅ Consistent template UI across all entry points
- ✅ All 5 templates visible and selectable
- ✅ Descriptions explain AI behavior and best use cases
- ✅ Template styling applied correctly
- ✅ Template ID flows: selection → database → AI → export
- ✅ Zero TypeScript/runtime errors

## Common Issues & Solutions

### Issue: Template not applying visual style

**Solution**: Check template config in `resumeTemplates.ts` - ensure `style` object complete

### Issue: AI not respecting template

**Solution**: Verify `templateId` passed in `generateResume()` options

### Issue: Missing "Academic CV" in ResumeStarter

**Solution**: Verify TemplateSelector imported and used correctly (not hardcoded array)

### Issue: Descriptions too long/overflow

**Solution**: Descriptions are multi-line capable - check card `minHeight: 40` constraint

## Quick Smoke Test (2 minutes)

**Minimal verification:**

1. ✅ Open `/ai/resume` → Create New Resume → See all 5 templates
2. ✅ Create draft with "Modern Tech" → Draft created
3. ✅ Open new draft dialog → See same template UI
4. ✅ Create draft with "Academic CV" → Draft created
5. ✅ Both drafts load correctly with correct templates

If all pass → Template unification successful! 🎉

## Reporting Issues

If any test fails, report with:

- Test number and name
- Steps to reproduce
- Expected result
- Actual result
- Browser console errors (if any)
- Screenshots (if visual issue)

---

**Last Updated**: 2025-11-10
**Next Review**: Before Sprint 2 Demo
