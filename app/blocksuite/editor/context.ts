"use client";

import { createContext, useContext } from 'react';

export interface EditorContextType {
  editor: any;
  collection: any;
  updateCollection: (newCollection: any) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}
