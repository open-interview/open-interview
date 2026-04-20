/**
 * Code Editor Component using Monaco Editor (VS Code's editor)
 * Provides professional syntax highlighting, auto-completion, and code editing
 */

import { useRef, useCallback } from 'react';
import Editor, { OnMount, OnChange, loader, Monaco } from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

// Light themes list for theme detection - only premium-dark now
const lightThemes: string[] = [];

// Define custom VS Code Dark+ inspired theme
loader.init().then((monaco) => {
  monaco.editor.defineTheme('vscode-dark-plus', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'variable.predefined', foreground: '4FC1FF' },
      { token: 'constant', foreground: '4FC1FF' },
      { token: 'parameter', foreground: '9CDCFE' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'delimiter', foreground: 'D4D4D4' },
      { token: 'tag', foreground: '569CD6' },
      { token: 'attribute.name', foreground: '9CDCFE' },
      { token: 'attribute.value', foreground: 'CE9178' },
    ],
    colors: {
      'editor.background': '#0F0F0F',
      'editor.foreground': '#E0E0E0',
      'editor.lineHighlightBackground': '#1A1A1A',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorLineNumber.foreground': '#6E7681',
      'editorLineNumber.activeForeground': '#FFFFFF',
      'editorCursor.foreground': '#00FF88',
      'editor.selectionHighlightBackground': '#ADD6FF26',
      'editorIndentGuide.background': '#2A2A2A',
      'editorIndentGuide.activeBackground': '#00FF88',
      'editorBracketMatch.background': '#0064001A',
      'editorBracketMatch.border': '#00FF88',
    },
  });
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'javascript' | 'python';
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = '300px',
}: CodeEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<unknown>(null);
  const isDark = !lightThemes.includes(theme);

  const handleEditorDidMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    // Focus the editor
    editor.focus();
  }, []);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      onChange(newValue || '');
    },
    [onChange]
  );

  return (
    <div className="overflow-hidden h-full" data-testid="monaco-editor">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={isDark ? 'vscode-dark-plus' : 'light'}
        options={{
          readOnly,
          minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
          fontSize: 14,
          fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', Menlo, Monaco, 'Courier New', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 4,
          glyphMargin: true,
          folding: true,
          foldingHighlight: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          lineDecorationsWidth: 10,
          lineHeight: 22,
          letterSpacing: 0.5,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: true,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          cursorStyle: 'line',
          cursorWidth: 2,
          smoothScrolling: true,
          mouseWheelZoom: true,
          contextmenu: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'currentDocument',
          parameterHints: { enabled: true },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoClosingDelete: 'always',
          autoSurround: 'languageDefined',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          renderWhitespace: 'selection',
          renderLineHighlight: 'all',
          renderLineHighlightOnlyWhenFocus: false,
          bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
          guides: {
            bracketPairs: true,
            bracketPairsHorizontal: true,
            highlightActiveBracketPair: true,
            indentation: true,
            highlightActiveIndentation: true,
          },
          matchBrackets: 'always',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'auto',
            verticalScrollbarSize: 14,
            horizontalScrollbarSize: 14,
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
          },
          overviewRulerLanes: 3,
          overviewRulerBorder: true,
          hideCursorInOverviewRuler: false,
          stickyScroll: { enabled: false },
          find: {
            addExtraSpaceOnTop: true,
            autoFindInSelection: 'multiline',
            seedSearchStringFromSelection: 'selection',
          },
          suggest: {
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showSnippets: true,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#0F0F0F]">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm text-muted-foreground font-mono">Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
}

// Read-only code display component using Monaco
export function CodeDisplay({
  code,
  language,
  height = '200px',
}: {
  code: string;
  language: 'javascript' | 'python';
  height?: string;
}) {
  const { theme } = useTheme();
  const isDark = !lightThemes.includes(theme);

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Editor
        height={height}
        language={language}
        value={code}
        theme={isDark ? 'vs-dark' : 'light'}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, 'Courier New', monospace",
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 8,
          lineHeight: 20,
          padding: { top: 8, bottom: 8 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          domReadOnly: true,
          renderLineHighlight: 'none',
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'auto',
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}
