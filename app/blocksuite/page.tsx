"use client";

import { EditorProvider } from './components/EditorProvider';
import EditorContainer from './components/EditorContainer';
import './index.css';

function App() {
  return (
    <EditorProvider>
      <div className="app">
        <div className="main-content">
          <EditorContainer />
        </div>
      </div>
    </EditorProvider>
  );
}

export default App;