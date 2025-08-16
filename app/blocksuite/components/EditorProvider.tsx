'use client';

import React, { useState, useEffect } from 'react';
import { EditorContext, type EditorContextType } from '../editor/context';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [editorState, setEditorState] = useState<EditorContextType | null>(null);

  useEffect(() => {
    const initializeEditor = async () => {
      const { initEditor } = await import('../editor/editor');
      const { editor, collection } = initEditor();
      setEditorState({
        editor,
        collection,
        updateCollection: (newCollection: any) => {
          setEditorState((prev: EditorContextType | null) => prev ? { ...prev, collection: newCollection } : null);
        }
      });
    };

    initializeEditor();
  }, []);

  return (
    <EditorContext.Provider value={editorState}>
      {children}
    </EditorContext.Provider>
  );
};
