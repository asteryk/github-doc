'use client';

import { useEffect, useRef } from 'react';
import { useEditor } from '../editor/context';

const EditorContainer = () => {
  const editorContext = useEditor();
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorContainerRef.current && editorContext?.editor) {
      editorContainerRef.current.innerHTML = '';
      editorContainerRef.current.appendChild(editorContext.editor);
    }
  }, [editorContext?.editor]);

  if (!editorContext) {
    return <div className="editor-loading">Loading editor...</div>;
  }

  return <div className="editor-container" ref={editorContainerRef}></div>;
};

export default EditorContainer;
