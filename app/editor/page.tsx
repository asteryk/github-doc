"use client";

import { useState, useEffect } from "react";
import { Octokit } from "@octokit/rest";

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
}

export default function Editor() {
  const [config, setConfig] = useState<GitHubConfig | null>(null);
  const [octokit, setOctokit] = useState<Octokit | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedConfig = localStorage.getItem("github-config");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setConfig(config);
      setOctokit(new Octokit({ auth: config.token }));
    }
  }, []);

  // 获取仓库文件列表
  const fetchFiles = async () => {
    if (!octokit || !config) return;

    try {
      setIsLoading(true);
      const response = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: config.path,
      });

      if (Array.isArray(response.data)) {
        const fileList = response.data
          .filter((item) => item.type === "file" && item.name.endsWith(".md"))
          .map((item) => ({
            name: item.name,
            path: item.path,
            sha: item.sha,
            content: "",
          }));
        setFiles(fileList);
      }
    } catch (error) {
      console.error("获取文件列表失败:", error);
      alert("获取文件列表失败，请检查配置和权限");
    } finally {
      setIsLoading(false);
    }
  };

  // 获取文件内容
  const fetchFileContent = async (file: FileInfo) => {
    if (!octokit || !config) return;

    try {
      setIsLoading(true);
      const response = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: file.path,
      });

      if ("content" in response.data) {
        const content = atob(response.data.content);
        const updatedFile = { ...file, content };
        setSelectedFile(updatedFile);
        setContent(content);

        // 更新文件列表中的内容
        setFiles((prev) =>
          prev.map((f) => (f.path === file.path ? updatedFile : f))
        );
      }
    } catch (error) {
      console.error("获取文件内容失败:", error);
      alert("获取文件内容失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 保存文件到GitHub
  const saveFile = async () => {
    if (!octokit || !config || !selectedFile) return;

    try {
      setIsLoading(true);
      const contentBase64 = btoa(content);

      await octokit.repos.createOrUpdateFileContents({
        owner: config.owner,
        repo: config.repo,
        path: selectedFile.path,
        message: message || `Update ${selectedFile.name}`,
        content: contentBase64,
        sha: selectedFile.sha,
      });

      // 更新SHA
      const updatedFile = { ...selectedFile, content };
      setSelectedFile(updatedFile);
      setFiles((prev) =>
        prev.map((f) => (f.path === selectedFile.path ? updatedFile : f))
      );

      alert("文件保存成功！");
      setMessage("");
    } catch (error) {
      console.error("保存文件失败:", error);
      alert("保存文件失败，请检查权限和网络连接");
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新文件
  const createNewFile = () => {
    const fileName = prompt("请输入文件名 (例如: new-doc.md):");
    if (!fileName || !config) return;

    const filePath = `${config.path}${fileName}`;
    const newFile: FileInfo = {
      name: fileName,
      path: filePath,
      sha: "",
      content: "",
    };

    setFiles((prev) => [...prev, newFile]);
    setSelectedFile(newFile);
    setContent("");
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">请先配置GitHub信息</p>
          <a href="/" className="text-blue-600 hover:underline">
            返回配置页面
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {config.owner}/{config.repo}
            </h1>
            <p className="text-sm text-gray-500">文档路径: {config.path}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchFiles}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "加载中..." : "刷新文件列表"}
            </button>
            <button
              onClick={createNewFile}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              新建文档
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              配置
            </a>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* 左侧文件列表 */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">文档列表</h3>
            {files.length === 0 ? (
              <p className="text-gray-500 text-sm">
                暂无文档，点击"刷新文件列表"加载
              </p>
            ) : (
              <div className="space-y-1">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => fetchFileContent(file)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 ${
                      selectedFile?.path === file.path
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    {file.name}
                  </button>
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
              <div className="bg-white border-b px-6 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    {selectedFile.name}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="提交信息 (可选)"
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={saveFile}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? "保存中..." : "保存到GitHub"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 编辑器 */}
              <div className="flex-1 p-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="在这里编辑你的文档内容..."
                  className="w-full h-full p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>选择一个文档开始编辑</p>
                <p className="text-sm mt-2">或点击"新建文档"创建新文件</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
