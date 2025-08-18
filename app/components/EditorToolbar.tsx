"use client";

import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
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
            title="粗体 (Ctrl+B)"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="斜体 (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="删除线"
          >
            <span className="line-through">S</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="行内代码"
          >
            <code className="text-xs bg-gray-100 px-1 rounded">&lt;/&gt;</code>
          </ToolbarButton>
        </ButtonGroup>

        {/* 标题 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="标题 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="标题 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="标题 3"
          >
            H3
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="正文"
          >
            P
          </ToolbarButton>
        </ButtonGroup>

        {/* 列表 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="无序列表"
          >
            • 列表
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="有序列表"
          >
            1. 列表
          </ToolbarButton>
        </ButtonGroup>

        {/* 引用和代码块 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="引用"
          >
            "
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="代码块"
          >
            <></>
          </ToolbarButton>
        </ButtonGroup>

        {/* 表格 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="插入表格"
          >
            表格
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            disabled={!editor.can().addColumnBefore()}
            title="在前面添加列"
          >
            +列
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            disabled={!editor.can().deleteColumn()}
            title="删除列"
          >
            -列
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowBefore().run()}
            disabled={!editor.can().addRowBefore()}
            title="在上面添加行"
          >
            +行
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            disabled={!editor.can().deleteRow()}
            title="删除行"
          >
            -行
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={!editor.can().deleteTable()}
            title="删除表格"
          >
            删表
          </ToolbarButton>
        </ButtonGroup>

        {/* 其他操作 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="分隔线"
          >
            ---
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHardBreak().run()}
            title="强制换行"
          >
            ↵
          </ToolbarButton>
        </ButtonGroup>

        {/* 撤销重做 */}
        <ButtonGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="撤销 (Ctrl+Z)"
          >
            ↶
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="重做 (Ctrl+Y)"
          >
            ↷
          </ToolbarButton>
        </ButtonGroup>
      </div>
    </div>
  );
};

export default EditorToolbar;