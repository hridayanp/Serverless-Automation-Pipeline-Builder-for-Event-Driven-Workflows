/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';

export interface CodeEditorProps {
  initialCode?: string;
  isOutput?: boolean; // NEW: Show output & Run button
}

export interface CodeEditorRef {
  runCode: () => void;
  getValue: () => string;
}

const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  ({ initialCode = '', isOutput = false }, ref) => {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const pyodideRef = useRef<any>(null);
    const monacoEditorRef = useRef<any>(null);

    // Load Pyodide on mount (only if isOutput is true)
    useEffect(() => {
      if (isOutput) initPyodide();
    }, [isOutput]);

    const initPyodide = async () => {
      setLoading(true);
      try {
        const loadPyodide = (window as any).loadPyodide;
        if (!loadPyodide) {
          throw new Error('Pyodide script not loaded yet.');
        }
        pyodideRef.current = await loadPyodide();
      } catch (err: any) {
        console.error('Failed to load Pyodide:', err);
        setOutput(`❌ Pyodide load failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const runCode = async () => {
      setOutput('');
      const currentCode = monacoEditorRef.current?.getValue?.() || '';
      try {
        if (!pyodideRef.current) {
          await initPyodide();
        }
        const result = await pyodideRef.current.runPythonAsync(currentCode);
        setOutput(result?.toString() || 'No output');
      } catch (err: any) {
        setOutput(`❌ Python Error: ${err.message}`);
      }
    };

    useImperativeHandle(ref, () => ({
      runCode,
      getValue: () => monacoEditorRef.current?.getValue?.() || '',
    }));

    return (
      <div className="w-full flex flex-col gap-4 p-4 border rounded-xl shadow-sm bg-white">
        {/* Run Button (conditionally shown) */}
        {isOutput && (
          <div className="flex justify-end">
            <Button onClick={runCode} disabled={loading}>
              {loading ? 'Loading Pyodide...' : 'Run'}
            </Button>
          </div>
        )}

        {/* Monaco Editor */}
        <Editor
          height="400px"
          defaultLanguage="python"
          language="python"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={(editor) => {
            monacoEditorRef.current = editor;
          }}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
          }}
        />

        {/* Output Panel (conditionally shown) */}
        {isOutput && (
          <div className="bg-gray-100 p-3 rounded-md border text-sm font-mono whitespace-pre-wrap min-h-[100px]">
            <strong>Output:</strong>
            <div>{output || '(no output yet)'}</div>
          </div>
        )}
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
