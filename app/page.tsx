"use client";

import { useState } from "react";

export default function Home() {
  const [config, setConfig] = useState({
    owner: "",
    repo: "",
    token: "",
    path: "docs/",
  });

  const handleSave = () => {
    localStorage.setItem("github-config", JSON.stringify(config));
    alert("配置已保存！");
  };

  const handleLoad = () => {
    const saved = localStorage.getItem("github-config");
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          GitHub 文档编辑器
        </h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">GitHub 配置</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                仓库所有者 (Owner)
              </label>
              <input
                type="text"
                value={config.owner}
                onChange={(e) =>
                  setConfig({ ...config, owner: e.target.value })
                }
                placeholder="例如: username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                仓库名称 (Repository)
              </label>
              <input
                type="text"
                value={config.repo}
                onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                placeholder="例如: my-docs"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Token
              </label>
              <input
                type="password"
                value={config.token}
                onChange={(e) =>
                  setConfig({ ...config, token: e.target.value })
                }
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                在 GitHub Settings → Developer settings → Personal access tokens
                中创建
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文档路径
              </label>
              <input
                type="text"
                value={config.path}
                onChange={(e) => setConfig({ ...config, path: e.target.value })}
                placeholder="例如: docs/"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              保存配置
            </button>
            <button
              onClick={handleLoad}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              加载配置
            </button>
          </div>

          {config.owner && config.repo && config.token && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">
                ✅ 配置完整！现在可以进入编辑器了
              </p>
              <a
                href="/editor"
                className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                进入编辑器
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">使用说明</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>填写你的 GitHub 仓库信息</li>
            <li>创建 Personal Access Token (需要 repo 权限)</li>
            <li>保存配置后进入编辑器</li>
            <li>在编辑器中手动拉取和提交文档</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
