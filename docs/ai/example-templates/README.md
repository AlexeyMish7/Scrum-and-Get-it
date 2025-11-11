# Cover Letter Template Examples

This folder contains example cover letter templates in JSON format that demonstrate the custom template import functionality.

## Available Example Templates

### 1. Modern Startup (`cover-letter-template-modern.json`)

- **Style**: Contemporary, clean design
- **Best for**: Startups, tech companies, fast-paced environments
- **Tone**: Enthusiastic
- **Features**:
  - Inter font family
  - Casual salutation/closing
  - No date or address (modern approach)
  - Compact margins

### 2. Minimal Clean (`cover-letter-template-minimal.json`)

- **Style**: Simple, elegant, content-focused
- **Best for**: Any industry where content is priority
- **Tone**: Formal
- **Features**:
  - Helvetica Neue font
  - Formal salutation/closing
  - Includes date
  - Classic black/gray color scheme

## How to Import a Template

### Option 1: Using the Template Gallery UI

1. Navigate to `/ai/templates`
2. Click "Cover Letter Templates" tab
3. Scroll to the bottom and click "Import Template"
4. Select one of the JSON files from this folder
5. The template will be added to your custom templates library

### Option 2: Programmatically

```typescript
import { importCustomTemplate } from "@ai/config/coverLetterTemplates";

// In a file input handler
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const template = await importCustomTemplate(file);
    console.log("Imported template:", template.name);
  } catch (error) {
    console.error("Import failed:", error);
  }
};
```

## Creating Your Own Custom Templates

To create a custom template:

1. Copy one of the example JSON files
2. Modify the fields (name, description, colors, fonts, etc.)
3. Save with a unique `id` (e.g., `"my-custom-template"`)
4. Import via the Template Gallery UI

### Template Structure

```json
{
  "id": "unique-id",
  "name": "Template Display Name",
  "description": "What makes this template special",
  "category": "professional|creative|minimal|technical|modern",
  "isSystem": false,
  "style": {
    "fontFamily": "CSS font-family string",
    "fontSize": 11,
    "lineHeight": 1.6,
    "margins": { "top": 72, "right": 72, "bottom": 72, "left": 72 },
    "colors": {
      "primary": "#000000",
      "text": "#333333",
      "accent": "#666666",
      "background": "#FFFFFF"
    }
  },
  "formatting": {
    "headerStyle": "left|center|right",
    "paragraphSpacing": 16,
    "salutationStyle": "formal|casual",
    "closingStyle": "formal|casual",
    "includeDate": true,
    "includeAddress": false
  },
  "defaultTone": "formal|casual|enthusiastic|analytical",
  "defaultLength": "brief|standard|detailed",
  "defaultCulture": "corporate|startup|creative",
  "structure": {
    "opening": "Template text with [POSITION] and [COMPANY] placeholders",
    "bodyParagraphs": 2,
    "closing": "Closing template text with [COMPANY] placeholder"
  }
}
```

## Notes

- Custom templates are stored in localStorage (`sgt:cover_letter_templates`)
- Imported templates automatically get `isSystem: false`
- Duplicate IDs are auto-renamed with timestamp suffix
- Templates can be exported back to JSON for sharing

## System Templates (Built-in, Read-Only)

The app includes 3 system templates that cannot be modified:

1. **Formal Corporate** - Traditional professional template
2. **Creative Design** - Visually appealing for creative industries
3. **Technical Professional** - Clean, data-focused for technical roles

These system templates serve as the foundation, while custom templates allow for unlimited personalization.
