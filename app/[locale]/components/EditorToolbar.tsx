"use client";

import { Editor } from '@tiptap/react';
import { useTranslations } from 'next-intl';

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  const t = useTranslations('toolbar');
  
  if (!editor) {
    return null;
  }

  const ButtonGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="flex border border-gray-200 rounded-md overflow-hidden">
      {children}
    </div>
  );

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        px-3 py-2 text-sm font-medium border-r border-gray-200 last:border-r-0
        transition-colors duration-150 ease-in-out
        ${isActive 
          ? 'bg-blue-100 text-blue-700 border-blue-200' 
          : 'bg-white text-gray-700 hover:bg-gray-50'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-gray-50'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3 sticky top-0 z-10">
      <div className="flex flex-wrap items-center gap-2">
        {/* 文本格式化 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title={t('bold')}
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title={t('italic')}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title={t('strikethrough')}
          >
            <span className="line-through">S</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title={t('inlineCode')}
          >
            <code className="text-xs bg-gray-100 px-1 rounded">&lt;/&gt;</code>
          </ToolbarButton>
        </ButtonGroup>

        {/* 标题 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title={t('heading1')}
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title={t('heading2')}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title={t('heading3')}
          >
            H3
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title={t('paragraph')}
          >
            P
          </ToolbarButton>
        </ButtonGroup>

        {/* 列表 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title={t('bulletList')}
          >
            • 列表
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title={t('orderedList')}
          >
            1. 列表
          </ToolbarButton>
        </ButtonGroup>

        {/* 引用和代码块 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title={t('blockquote')}
          >
            "
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title={t('codeBlock')}
          >
            <></>
          </ToolbarButton>
        </ButtonGroup>

        {/* 表格 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title={t('insertTable')}
          >
            表格
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            disabled={!editor.can().addColumnBefore()}
            title={t('addColumnBefore')}
          >
            +列
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            disabled={!editor.can().deleteColumn()}
            title={t('deleteColumn')}
          >
            -列
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowBefore().run()}
            disabled={!editor.can().addRowBefore()}
            title={t('addRowBefore')}
          >
            +行
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            disabled={!editor.can().deleteRow()}
            title={t('deleteRow')}
          >
            -行
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={!editor.can().deleteTable()}
            title={t('deleteTable')}
          >
            删表
          </ToolbarButton>
        </ButtonGroup>

        {/* 其他操作 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title={t('horizontalRule')}
          >
            ---
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHardBreak().run()}
            title={t('hardBreak')}
          >
            ↵
          </ToolbarButton>
        </ButtonGroup>

        {/* 撤销重做 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title={t('undo')}
          >
            ↶
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title={t('redo')}
          >
            ↷
          </ToolbarButton>
        </ButtonGroup>
      </div>
    </div>
  );
};

export default EditorToolbar;