// EditCoverLetter.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Popover,
  List,
  ListItem,
  ListItemButton,
} from "@mui/material";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useDebouncedCallback } from "use-debounce";

// Version history type
interface VersionEntry {
  timestamp: string;
  content: string;
}

// Simple readability score (Flesch–Kincaid Grade Level)
function getReadability(text: string) {
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const syllables = text
    .toLowerCase()
    .split(/\s+/)
    .reduce((acc, word) => acc + countSyllables(word), 0);

  const fleschKincaid =
    0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;

  let suggestion = "";
  if (fleschKincaid > 12) suggestion = "Simplify your sentences.";
  else if (fleschKincaid < 6) suggestion = "Consider adding more detail.";
  else suggestion = "Good readability.";

  return { score: fleschKincaid.toFixed(1), suggestion };
}

// Simple syllable counter
function countSyllables(word: string) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  const syllables = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

// Sentence & paragraph suggestions
function getSentenceSuggestions(text: string) {
  const sentences = text.split(/([.!?])\s+/);
  const suggestions: { sentence: string; suggestion: string }[] = [];

  sentences.forEach((sentence) => {
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount > 25) {
      suggestions.push({
        sentence,
        suggestion: "Consider splitting this long sentence.",
      });
    }
    if (/(\bwas\b|\bwere\b|\bis\b|\bare\b)\s+\w+ed\b/i.test(sentence)) {
      suggestions.push({
        sentence,
        suggestion: "Consider using active voice.",
      });
    }
    if (/very|really|just/i.test(sentence)) {
      suggestions.push({
        sentence,
        suggestion: "Consider removing filler words.",
      });
    }
  });

  return suggestions;
}

const defaultCoverLetter = `
<p>Dear Hiring Manager,</p>
<p>I am excited to apply for the Software Engineer position at Acme Tech. With a strong background in full-stack development and experience in building scalable web applications, I am confident in my ability to contribute effectively to your team.</p>
<p>During my time at XYZ Corp, I led the development of a customer portal that improved user engagement by 35%. I have hands-on experience with React, Node.js, and SQL databases, and I thrive in collaborative, fast-paced environments.</p>
<p>I am particularly drawn to Acme Tech because of your innovative approach to cloud solutions and commitment to fostering professional growth. I would welcome the opportunity to bring my skills and passion for software engineering to your team.</p>
<p>Thank you for considering my application. I look forward to the possibility of discussing how my experience aligns with your needs.</p>
<p>Sincerely,<br/>Nafisa Ahmed</p>
`;

const EditCoverLetter: React.FC = () => {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [readability, setReadability] = useState<{
    score: string;
    suggestion: string;
  }>({
    score: "0",
    suggestion: "",
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: defaultCoverLetter,
    onUpdate: ({ editor }) => {
      handleAutosave(editor.getHTML());
      const plain = editor.getText();
      setReadability(getReadability(plain));
    },
  });

  // Autosave every 2 seconds after typing
  const handleAutosave = useDebouncedCallback((content: string) => {
    const timestamp = new Date().toISOString();
    setVersions((prev) => [...prev, { timestamp, content }]);
    console.log("Auto-saved at", timestamp);
  }, 2000);

  if (!editor) return null;

  const plainText = editor.getText();
  const charCount = plainText.length;
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;

  // Fetch synonyms for selected word
  const fetchSynonyms = async (word: string) => {
    if (!word) return;
    const res = await fetch(`https://api.datamuse.com/words?rel_syn=${word}`);
    const data = (await res.json()) as Array<{ word: string }>;
    setSynonyms(data.map((w) => w.word));
  };

  // Handle word selection
  const handleSelection = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      fetchSynonyms(selection);
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
    }
  };

  // Replace selected word with synonym
  const replaceWord = (syn: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(syn));
    setAnchorEl(null);
  };

  const sentenceSuggestions = getSentenceSuggestions(plainText);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Edit Cover Letter
      </Typography>

      <Paper sx={{ p: 2, minHeight: 300, mb: 2 }}>
        <EditorContent
          editor={editor}
          spellCheck={true}
          onMouseUp={handleSelection}
        />
      </Paper>

      {/* Stats */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography>Characters: {charCount}</Typography>
        <Typography>Words: {wordCount}</Typography>
        <Typography>
          Readability: {readability.score} ({readability.suggestion})
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          const timestamp = new Date().toISOString();
          setVersions((prev) => [
            ...prev,
            { timestamp, content: editor.getHTML() },
          ]);
          alert("Cover letter saved!");
        }}
      >
        Save
      </Button>

      {/* Version History */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Version History</Typography>
        {versions.map((v, idx) => (
          <Paper
            key={idx}
            sx={{
              p: 1,
              mb: 1,
              fontSize: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <strong>{v.timestamp}:</strong> {v.content.substring(0, 50)}...
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                editor.commands.setContent(v.content);
                alert(`Restored version from ${v.timestamp}`);
              }}
            >
              Restore
            </Button>
          </Paper>
        ))}
      </Box>

      {/* Sentence Suggestions */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Sentence Suggestions</Typography>
        {sentenceSuggestions.map((s, idx) => (
          <Paper key={idx} sx={{ p: 1, mb: 1, fontSize: 14 }}>
            <strong>Sentence:</strong> {s.sentence} <br />
            <strong>Suggestion:</strong> {s.suggestion}
          </Paper>
        ))}
      </Box>

      {/* Synonym Suggestions Popover */}
      <Popover
        open={Boolean(anchorEl) && synonyms.length > 0}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <List dense>
          {synonyms.map((syn) => (
            <ListItem key={syn} disablePadding>
              <ListItemButton onClick={() => replaceWord(syn)}>
                {syn}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Popover>
    </Box>
  );
};

export default EditCoverLetter;
