"use client";

import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { diffChars } from "diff";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { common, createLowlight } from 'lowlight';
import { useTranslations } from 'next-intl';
import ConfirmDialog from "../components/ConfirmDialog";
import InputDialog from "../components/InputDialog";
import EditorToolbar from "../components/EditorToolbar";
import LanguageSelector from "../components/LanguageSelector";
import {
  documentDB,
  configDB,
  initDB,
  type DocumentRecord,
} from "@/lib/indexeddb";

interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  path: string;
}

interface FileInfo {
  name: string;
  path: string;
  sha: string;
  content: string;
  source?: string; // 新增：标记文件来源
  is_conflict?: boolean; // 新增：标记冲突
  conflict_with?: string; // 新增：冲突来源
}

// 确认弹窗状态接口
interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

// 输入弹窗状态接口
interface InputDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

// 文件内容比对函数
const compareFileContent = (
  localContent: string,
  remoteContent: string
): string => {
  const differences = diffChars(localContent, remoteContent);
  let diffText = "";

  differences.forEach((part: any) => {
    if (part.added) {
      diffText += `\n+ ${part.value}`;
    } else if (part.removed) {
      diffText += `\n- ${part.value}`;
    } else {
      diffText += part.value;
    }
  });

  return diffText;
};

export default function Editor() {
  const t = useTranslations();
  const [config, setConfig] = useState<GitHubConfig | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null
  );
  const [inputDialog, setInputDialog] = useState<InputDialogState | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isConfigEmpty, setIsConfigEmpty] = useState(false);

  // 创建lowlight实例
  const lowlight = createLowlight(common);

  // Tiptap 编辑器初始化
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 禁用默认的代码块，使用lowlight版本
      }),
      Typography,
      Placeholder.configure({
        placeholder: t('editor.placeholder'),
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      // 内容变化会在 useEffect 中处理保存逻辑
    },
  });

  // 本地保存文档
  const saveToLocal = useCallback(async () => {
    if (!selectedFile || !content) return;

    try {
      await documentDB.save({
        path: selectedFile.path,
        name: selectedFile.name,
        content,
        sha: selectedFile.sha,
      });

      toast.success(t('messages.saveLocalSuccess'));
      setHasUnsavedChanges(false);

      // 更新本地文件列表
      await loadLocalFiles();
    } catch (error) {
      console.error(t('errors.savedLocalFailed'), error);
      toast.error(t('errors.savedLocalFailed'));
    }
  }, [selectedFile, content]);

  // 加载本地文件
  const loadLocalFiles = async () => {
    try {
      const documents = await documentDB.getAll();

      const localFiles = documents.map((doc) => ({
        name: doc.name,
        path: doc.path,
        sha: doc.sha,
        content: doc.content,
      }));

      // 按文件名字母顺序排序
      const sortedFiles = localFiles.sort((a: FileInfo, b: FileInfo) =>
        a.name.localeCompare(b.name)
      );

      setFiles(sortedFiles);

      // 如果有选中的文件，更新其内容
      if (selectedFile) {
        const updatedFile = sortedFiles.find(
          (f: FileInfo) => f.path === selectedFile.path
        );
        if (updatedFile) {
          setSelectedFile(updatedFile);
          setContent(updatedFile.content);
        }
      }
    } catch (error) {
      console.error(t('errors.loadLocalFilesFailed'), error);
    }
  };

  // 刷新本地文件列表（不拉取远端）
  const refreshLocalFiles = async () => {
    await loadLocalFiles();
    toast.success(t('toast.refreshed'));
  };

  // 自动初始化数据库并加载配置和本地文件
  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        await loadConfig();
        await loadLocalFiles();
      } catch (error) {
        console.error(t('config.initFailed'), error);
        toast.error(t('config.dbInitFailed'));
      }
    };
    init();
  }, []);

  // 加载配置
  const loadConfig = async () => {
    try {
      setIsConfigLoading(true);
      const activeConfig = await configDB.getActive();

      if (activeConfig) {
        // 检查是否已经有配置了，避免重复加载
        if (config) {
          console.log(t('messages.configExists'));
          setIsConfigLoading(false);
          return;
        }

        // 检查配置是否完整
        if (activeConfig.token) {
          // 配置完整，直接使用
          setConfig(activeConfig);
          setIsConfigEmpty(false);
          toast.success(t('messages.configAutoLoaded'));
        } else {
          // 缺少token，需要用户输入
          setInputDialog({
            isOpen: true,
            title: t('prompts.enterGithubToken'),
            message: t('prompts.enterTokenMessage'),
            placeholder: t('config.tokenPlaceholder'),
            defaultValue: "",
            onConfirm: (token: string) => {
              setInputDialog(null);
              if (token) {
                const fullConfig: GitHubConfig = {
                  ...activeConfig,
                  token,
                };
                setConfig(fullConfig);
                setIsConfigEmpty(false);
                toast.success(t('messages.configLoaded'));
              }
            },
            onCancel: () => {
              setInputDialog(null);
              setIsConfigEmpty(true);
            },
          });
        }
      } else {
        // 没有配置，标记为空
        setIsConfigEmpty(true);
      }
    } catch (error) {
      console.error(t('errors.loadConfigFailed'), error);
      setIsConfigEmpty(true);
    } finally {
      setIsConfigLoading(false);
    }
  };

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveToLocal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [saveToLocal]);

  // 同步编辑器内容
  useEffect(() => {
    if (editor && selectedFile) {
      editor.commands.setContent(selectedFile.content);
    }
  }, [editor, selectedFile]);

  // 内容变化检测
  useEffect(() => {
    if (selectedFile && content !== selectedFile.content) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [content, selectedFile]);

  // 拉取单个文件（从GitHub获取文件内容）
  const pullFile = async (filePath: string) => {
    if (!config) return;

    try {
      setIsLoading(true);
      setError("");

      console.log(t('actions.pulling', { path: filePath }));

      const params = new URLSearchParams({
        owner: config.owner,
        repo: config.repo,
        path: filePath,
        token: config.token,
      });

      const response = await fetch(`/api/github?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if ("content" in data) {
        const remoteContent = atob(data.content);

        // 检查本地是否有同名文件
        const localFile = files.find((f) => f.path === filePath);

        if (localFile && localFile.content !== remoteContent) {
          // 内容不同，显示比对并询问用户
          const diffText = compareFileContent(localFile.content, remoteContent);

          setConfirmDialog({
            isOpen: true,
            title: t('prompts.contentDiffDetected'),
            message: t('prompts.contentDiffMessage', {
              diff: `${diffText.substring(0, 500)}${diffText.length > 500 ? "..." : ""}`
            }),
            type: "warning",
            onConfirm: async () => {
              setConfirmDialog(null);
              // 继续执行拉取逻辑
              try {
                await documentDB.save({
                  path: filePath,
                  name: data.name,
                  content: remoteContent,
                  sha: data.sha,
                });

                toast.success(t('messages.filePullSuccess'));
                await loadLocalFiles();
              } catch (error) {
                console.error(t('errors.saveLocalFailed'), error);
                toast.error(t('errors.saveLocalFailed'));
              }
            },
            onCancel: () => {
              setConfirmDialog(null);
              toast.success(t('messages.cancelPull'));
            },
          });
          return;
        }

        // 保存到本地数据库
        try {
          await documentDB.save({
            path: filePath,
            name: data.name,
            content: remoteContent,
            sha: data.sha,
          });

          toast.success(t('messages.filePullSuccess'));
          await loadLocalFiles();
        } catch (error) {
          console.error(t('errors.saveLocalFailed'), error);
          toast.error(t('errors.saveLocalFailed'));
        }
      }
    } catch (error: any) {
      console.error(t('errors.pullFileFailed'), error);
      toast.error(t('errors.pullFileFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 拉取远端新文件列表
  const pullNewFiles = async () => {
    if (!config) return;

    try {
      setIsLoading(true);
      setError("");

      console.log(t('actions.gettingFileList'));

      const params = new URLSearchParams({
        owner: config.owner,
        repo: config.repo,
        path: config.path,
        token: config.token,
      });

      const response = await fetch(`/api/github?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        const fileItems = data.filter((item) => item.type === "file");

        // 显示文件列表，让用户选择要拉取的文件
        if (fileItems.length > 0) {
          const fileList = fileItems
            .map((item) => `${item.name} (${item.path})`)
            .join("\n");

          setInputDialog({
            isOpen: true,
            title: t('prompts.selectFilesToPull'),
            message: `找到 ${fileItems.length} 个文件，请输入要拉取的文件名（多个文件用逗号分隔）：\n\n${fileList}`,
            placeholder: t('prompts.fileListPlaceholder'),
            defaultValue: "",
            onConfirm: async (selectedFiles: string) => {
              setInputDialog(null);

              if (selectedFiles) {
                const fileNames = selectedFiles
                  .split(",")
                  .map((name) => name.trim());

                for (const fileName of fileNames) {
                  const fileItem = fileItems.find(
                    (item) => item.name === fileName
                  );
                  if (fileItem) {
                    await pullFile(fileItem.path);
                  }
                }
              }
            },
            onCancel: () => {
              setInputDialog(null);
            },
          });
        } else {
          toast.success(t('messages.noFilesFound'));
        }
      }
    } catch (error: any) {
      console.error(t('errors.getFileListFailed'), error);
      toast.error(t('errors.getFileListFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 提交单个文件到GitHub
  const pushFile = async () => {
    if (!config || !selectedFile) return;

    try {
      setIsLoading(true);
      setError("");

      // 先进行本地保存
      if (hasUnsavedChanges) {
        console.log(t('actions.savingBeforeCommit'));
        await saveToLocal();
      }

      // 先检查远端文件内容
      const params = new URLSearchParams({
        owner: config.owner,
        repo: config.repo,
        path: selectedFile.path,
        token: config.token,
      });

      const checkResponse = await fetch(`/api/github?${params}`);

      if (checkResponse.ok) {
        const remoteData = await checkResponse.json();

        if ("content" in remoteData) {
          const remoteContent = atob(remoteData.content);

          // 如果远端内容比本地多，提示用户
          if (remoteContent.length > content.length) {
            const diffText = compareFileContent(content, remoteContent);

            setConfirmDialog({
              isOpen: true,
              title: t('prompts.remoteContentDiff'),
              message: t('prompts.remoteContentMessage', {
                diff: (remoteContent.length - content.length),
                changes: `${diffText.substring(0, 500)}${diffText.length > 500 ? "..." : ""}`
              }),
              type: "warning",
              onConfirm: async () => {
                setConfirmDialog(null);
                // 继续执行提交逻辑
                await performGitHubPush(params);
              },
              onCancel: () => {
                setConfirmDialog(null);
                toast.success(t('messages.cancelCommit'));
              },
            });
            return;
          }
        }
      }

      // 直接提交到GitHub
      await performGitHubPush(params);
    } catch (error: any) {
      console.error(t('errors.commitFileFailed'), error);

      let errorMessage = t('errors.commitFileFailed');
      if (error.message.includes("Conflict")) {
        errorMessage = t('errors.fileModified');
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 执行GitHub提交的辅助函数
  const performGitHubPush = async (params: URLSearchParams) => {
    if (!selectedFile) return;

    const contentBase64 = btoa(content);
    console.log(t('actions.committingFile', { path: selectedFile.path }));

    const response = await fetch(`/api/github?${params}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message || `Update ${selectedFile.name}`,
        content: contentBase64,
        sha: selectedFile.sha,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // 更新SHA
    const updatedFile: FileInfo = { ...selectedFile, content };
    setSelectedFile(updatedFile);
    setFiles((prev) =>
      prev.map((f) => (f.path === selectedFile.path ? updatedFile : f))
    );

    toast.success(t('messages.fileCommitSuccess'));
    setMessage("");
    setHasUnsavedChanges(false);
    console.log(t('actions.fileCommitSuccess'));
  };

  // 创建新文档
  const createNewFile = () => {
    if (!config) return;

    setInputDialog({
      isOpen: true,
      title: t('dialog.createNewFile'),
      message: t('dialog.enterFileName'),
      placeholder: t('config.pathPlaceholder').replace('docs/', 'new-doc.md'),
      defaultValue: "",
      onConfirm: async (fileName: string) => {
        setInputDialog(null);

        // 检查文件名是否已存在（全局唯一检查）
        const filePath = `${config.path}${fileName}`;
        const existingFile = files.find((f) => f.path === filePath);
        if (existingFile) {
          toast.error(t('errors.fileNameExists', { name: fileName }));
          return;
        }

        const newFile: FileInfo = {
          name: fileName,
          path: filePath,
          sha: "",
          content: "",
          source: "local", // 明确标记为本地文件
        };

        try {
          // 自动保存到本地数据库
          await documentDB.save({
            path: filePath,
            name: fileName,
            content: "",
            sha: "",
          });

          // 保存成功后，更新本地状态
          setFiles((prev) => [...prev, newFile]);
          setSelectedFile(newFile);
          setContent("");
          setHasUnsavedChanges(false);

          // 刷新本地文件列表以保持排序
          await loadLocalFiles();

          toast.success(`文件 "${fileName}" 创建成功并已保存到本地`);
        } catch (error) {
          console.error(t('errors.createFileFailed'), error);
          toast.error(t('errors.createFileFailed'));
        }
      },
      onCancel: () => {
        setInputDialog(null);
      },
    });
  };

  // 获取本地文件数量
  const getLocalFileCount = async (): Promise<number> => {
    try {
      const documents = await documentDB.getAll();
      return documents.length;
    } catch (error) {
      console.error(t('errors.getLocalFileCountFailed'), error);
      return 0;
    }
  };

  // 文件重命名
  const renameFile = async (oldPath: string, newName: string) => {
    if (!newName || newName.trim() === "") return;

    try {
      const oldFile = files.find((f) => f.path === oldPath);
      if (!oldFile) return;

      // 构建新路径
      const pathParts = oldPath.split("/");
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join("/");

      // 检查新路径是否已存在（全局唯一检查）
      const existingFile = files.find((f) => f.path === newPath);
      if (existingFile) {
        toast.error(`文件名 "${newName}" 已存在，请使用其他名称`);
        return;
      }

      // 保存新文件
      await documentDB.save({
        path: newPath,
        name: newName,
        content: oldFile.content,
        sha: oldFile.sha,
      });

      // 删除旧文件
      await documentDB.delete(oldPath);

      // 如果当前选中的是重命名的文件，更新选中状态
      if (selectedFile?.path === oldPath) {
        const newFile = { ...oldFile, path: newPath, name: newName };
        setSelectedFile(newFile);
      }

      toast.success(t('toast.fileRenamed'));
      await loadLocalFiles();
    } catch (error) {
      console.error(t('toast.renameFailed'), error);
      toast.error(t('toast.renameFailed'));
    }
  };

  // 处理重命名
  const handleRename = (file: FileInfo) => {
    setInputDialog({
      isOpen: true,
      title: t('dialog.renameFile'),
      message: t('dialog.enterNewName'),
      placeholder: t('dialog.enterNewName'),
      defaultValue: file.name,
      onConfirm: (newName: string) => {
        setInputDialog(null);
        if (newName && newName !== file.name) {
          renameFile(file.path, newName);
        }
      },
      onCancel: () => {
        setInputDialog(null);
      },
    });
  };

  // 文件删除
  const deleteFile = async (
    filePath: string,
    deleteRemote: boolean = false
  ) => {
    try {
      if (deleteRemote) {
        // 删除远端文件
        if (!config) return;

        // 获取要删除文件的SHA值
        const fileToDelete = files.find((f) => f.path === filePath);
        if (!fileToDelete || !fileToDelete.sha) {
          toast.error(t('errors.noFileSHA'));
          return;
        }

        const params = new URLSearchParams({
          owner: config.owner,
          repo: config.repo,
          path: filePath,
          token: config.token,
        });

        const response = await fetch(`/api/github?${params}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Delete ${filePath}`,
            sha: fileToDelete.sha,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || `HTTP ${response.status}`;

          // 处理特定错误状态码
          if (response.status === 409) {
            toast.error(t('errors.remoteFileModified'));
          } else if (response.status === 401) {
            toast.error(t('errors.authFailed'));
          } else if (response.status === 400) {
            // 400错误通常是参数问题，提供具体帮助
            if (errorMessage.includes("missing required field")) {
              toast.error(t('errors.missingRequiredField'));
            } else {
              toast.error(t('errors.requestParameterError'));
            }
            return; // 400错误直接返回，不继续执行
          }

          // 兜底处理：处理所有其他40x错误
          if (response.status >= 400 && response.status < 500) {
            const repoUrl = `https://github.com/${config.owner}/${config.repo}`;
            const fileUrl = `${repoUrl}/blob/main/${filePath}`;

            setConfirmDialog({
              isOpen: true,
              title: t('prompts.deleteRemoteFileFailed'),
              message: t('prompts.deleteRemoteFailedMessage', {
                error: errorMessage,
                url: fileUrl
              }),
              type: "warning",
              onConfirm: () => {
                setConfirmDialog(null);
                // 继续删除本地文件
                deleteFile(filePath, false);
              },
              onCancel: () => {
                setConfirmDialog(null);
                toast.success(t('messages.cancelDelete'));
              },
            });
            return;
          } else {
            // 处理5xx服务器错误
            toast.error(`服务器错误: ${errorMessage}`);
            return;
          }
        }

        toast.success(t('messages.bothFilesDeleted'));
      } else {
        toast.success(t('messages.localFileDeleted'));
      }

      // 删除本地文件
      await documentDB.delete(filePath);

      // 如果删除的是当前选中的文件，清空选择
      if (selectedFile?.path === filePath) {
        setSelectedFile(null);
        setContent("");
        setHasUnsavedChanges(false);
      }

      await loadLocalFiles();
    } catch (error) {
      console.error(t('toast.deleteFailed'), error);
      toast.error(t('toast.deleteFailed'));
    }
  };

  // 处理删除
  const handleDelete = (file: FileInfo) => {
    setConfirmDialog({
      isOpen: true,
      title: t('dialog.confirmDelete'),
      message: t('dialog.deleteMessage', { name: file.name }) + '\n\n' + t('dialog.deleteLocalOnly'),
      type: "danger",
      onConfirm: () => {
        setConfirmDialog(null);
        // 询问是否删除远端文件
        setConfirmDialog({
          isOpen: true,
          title: t('dialog.deleteRemote'),
          message: t('dialog.deleteRemoteMessage'),
          type: "warning",
          onConfirm: () => {
            setConfirmDialog(null);
            deleteFile(file.path, true);
          },
          onCancel: () => {
            setConfirmDialog(null);
            deleteFile(file.path, false);
          },
        });
      },
      onCancel: () => {
        setConfirmDialog(null);
      },
    });
  };

  if (isConfigLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (isConfigEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('common.pleaseConfigFirst')}</p>
          <a href="/config" className="text-blue-600 hover:underline">
            {t('common.goToConfig')}
          </a>
        </div>
      </div>
    );
  }

  // 确保config存在
  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.configLoading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* 顶部导航 */}
      <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              {config.owner}/{config.repo}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {t('nav.path')}: {config.path}
            </p>
            {hasUnsavedChanges && (
              <p className="text-xs sm:text-sm text-orange-600 mt-1">
                {t('nav.unsaved')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <LanguageSelector />
            <button
              onClick={refreshLocalFiles}
              disabled={isLoading}
              className="px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? t('nav.refreshing') : t('nav.refreshList')}
            </button>
            <button
              onClick={saveToLocal}
              disabled={!hasUnsavedChanges}
              className="px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <span className="hidden sm:inline">{t('nav.localSave')}</span>
              <span className="sm:hidden">{t('nav.localSave').split(' ')[0]}</span>
            </button>
            <button
              onClick={pullNewFiles}
              disabled={isLoading}
              className="px-3 py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {t('nav.pullNewFiles')}
            </button>
            <button
              onClick={createNewFile}
              className="px-3 py-2 text-xs sm:text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              {t('nav.newDocument')}
            </button>
            <a
              href="/config"
              className="px-3 py-2 text-xs sm:text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              {t('nav.config')}
            </a>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 mx-4 sm:mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {/* 左侧文件列表 */}
        <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r overflow-y-auto">
          <div className="p-3 sm:p-4">
            <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
              {t('fileList.title')}
            </h3>
            {files.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm">
                {t('ui.emptyFileList')}
              </p>
            ) : (
              <div className="space-y-1">
                {files.map((file) => (
                  <div key={file.path} className="relative">
                    <div
                      onClick={() => {
                        setSelectedFile(file);
                        setContent(file.content);
                        setHasUnsavedChanges(false);
                      }}
                      className={`w-full text-left px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm hover:bg-gray-100 ${
                        selectedFile?.path === file.path
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate flex-1">{file.name}</span>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pullFile(file.path);
                            }}
                            className="px-1.5 sm:px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            title={t('ui.pullFromGithub')}
                          >
                            <span className="hidden sm:inline">{t('ui.pullShort')}</span>
                            <span className="sm:hidden">{t('ui.pullIcon')}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRename(file);
                            }}
                            className="px-1.5 sm:px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            title={t('ui.renameFile')}
                          >
                            <span className="hidden sm:inline">{t('ui.renameShort')}</span>
                            <span className="sm:hidden">{t('ui.renameIcon')}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file);
                            }}
                            className="px-1.5 sm:px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title={t('ui.deleteFile')}
                          >
                            <span className="hidden sm:inline">{t('ui.deleteShort')}</span>
                            <span className="sm:hidden">{t('ui.deleteIcon')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧编辑器 */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* 文件信息 */}
              <div className="bg-white border-b px-3 sm:px-6 py-2 sm:py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                    {selectedFile.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('editor.commitMessage')}
                      className="w-full sm:w-auto px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm"
                    />
                    <button
                      onClick={pushFile}
                      disabled={isLoading}
                      className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? t('editor.saving') : t('editor.saveToGitHub')}
                    </button>
                  </div>
                </div>
              </div>

              {/* 编辑器 */}
              <div className="flex-1 flex flex-col bg-white">
                {editor ? (
                  <>
                    <EditorToolbar editor={editor} />
                    <div className="flex-1 overflow-y-auto">
                      <div className="max-w-4xl mx-auto p-8">
                        <EditorContent 
                          editor={editor} 
                          className="tiptap-editor min-h-[60vh] focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500 text-sm">{t('editor.loading')}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-gray-500">
                <p className="text-sm sm:text-base">{t('editor.selectFile')}</p>
                <p className="text-xs sm:text-sm mt-2">
                  {t('editor.createNew')}
                </p>
                <p className="text-xs mt-2 text-gray-400">
                  {t('editor.shortcut')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 确认弹窗 */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}

      {/* 输入弹窗 */}
      {inputDialog && (
        <InputDialog
          isOpen={inputDialog.isOpen}
          title={inputDialog.title}
          message={inputDialog.message}
          placeholder={inputDialog.placeholder}
          defaultValue={inputDialog.defaultValue}
          onConfirm={inputDialog.onConfirm}
          onCancel={inputDialog.onCancel}
        />
      )}
    </div>
  );
}
