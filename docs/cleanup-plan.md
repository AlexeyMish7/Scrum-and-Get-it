# Documentation Cleanup Plan

## 🗑️ **Files to Remove** (Duplicates/Moved)

After confirming all files have been successfully moved and the new structure is working:

### **Old Files in `/docs/` root:**

- `docs/SETUP.md` → Moved to `docs/getting-started/setup.md`
- `docs/ARCHITECTURE_OVERVIEW.md` → Moved to `docs/getting-started/architecture-overview.md`
- `docs/BRANCHING.md` → Moved to `docs/development/workflow/branching.md`
- `docs/COLLAB.md` → Moved to `docs/development/workflow/collaboration.md`
- `docs/COLORS.md` → Moved to `docs/design/colors.md`
- `docs/DocumentationStandards.md` → Moved to `docs/development/standards/documentation-standards.md`
- `docs/ComponentDocumentationTemplate.md` → Moved to `docs/development/standards/component-template.md`
- `docs/Sprint1PRD.md` → Moved to `docs/project-management/sprints/sprint1-prd.md`
- `docs/COPILOT_INSTRUCTIONS.md` → Duplicate, removed in favor of `.github/copilot-instructions.md`

### **Old Files in Root:**

- `Sprint1_DemoPlan.md` → Moved to `docs/project-management/sprints/sprint1-demo.md`

### **Old Files in `/todo/` folder:**

- `todo/TODO.md` → Moved to `docs/project-management/tasks/todo.md`
- `todo/ACCOUNT_DELETION_STEPS.md` → Moved to `docs/project-management/tasks/account-deletion.md`
- Consider removing entire `/todo/` folder after moving content

### **Duplicate Copilot Files:**

- `docs/COPILOT_INSTRUCTIONS.md` → Remove (duplicate)
- `.github/instructions/copilot_instructions.instructions.md` → Remove (duplicate)
- `.github/instructions/bug_hunter.instructions.md` → Keep if still needed, or move to tools
- `.github/instructions/refactorer.instructions.md` → Keep if still needed, or move to tools

### **Old Component Documentation:**

- `frontend/src/pages/education/AddEducation.md` → Moved to `docs/features/education/add-education-component.md`
- `frontend/src/hooks/README.md` → Moved to `docs/api/services/error-handling.md`

## ✅ **Verification Steps**

Before removing old files:

1. **Test Documentation Links**: Verify all internal links work in new structure
2. **Check Git References**: Ensure no workflows or scripts reference old paths
3. **Verify Copilot Instructions**: Test that AI assistants can find the new location
4. **Team Notification**: Inform team of new documentation structure
5. **Update Bookmarks**: Team members should update any bookmarked docs

## 🔄 **Cleanup Commands**

```powershell
# After verification, run these commands to clean up old files:

# Remove old files from docs root
Remove-Item "docs\SETUP.md"
Remove-Item "docs\ARCHITECTURE_OVERVIEW.md"
Remove-Item "docs\BRANCHING.md"
Remove-Item "docs\COLLAB.md"
Remove-Item "docs\COLORS.md"
Remove-Item "docs\DocumentationStandards.md"
Remove-Item "docs\ComponentDocumentationTemplate.md"
Remove-Item "docs\Sprint1PRD.md"
Remove-Item "docs\COPILOT_INSTRUCTIONS.md"

# Remove old files from root
Remove-Item "Sprint1_DemoPlan.md"

# Remove todo folder (after moving content)
Remove-Item "todo" -Recurse

# Remove duplicate copilot files
Remove-Item ".github\instructions\copilot_instructions.instructions.md"

# Remove old component docs (after moving)
Remove-Item "frontend\src\pages\education\AddEducation.md"
Remove-Item "frontend\src\hooks\README.md"
```

## 📋 **Post-Cleanup Tasks**

1. **Update .gitignore**: If any patterns reference old paths
2. **Update CI/CD**: If any automation references old documentation paths
3. **Update Team Wiki**: If external documentation references these files
4. **Archive Old Docs**: Consider creating an archive branch before deletion
5. **Update Templates**: Ensure new file templates reference correct paths

## 🎯 **Benefits Achieved**

✅ **Logical Organization**: Related docs are grouped together  
✅ **No Duplicates**: Single source of truth for each topic  
✅ **Scalable Structure**: Easy to add new features and documentation  
✅ **Clear Navigation**: Main index guides users to what they need  
✅ **Consistent Naming**: All files use lowercase, kebab-case  
✅ **Better Onboarding**: New developers can find information quickly
