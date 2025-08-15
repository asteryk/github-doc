import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const token = searchParams.get("token");

  if (!owner || !repo || !path || !token) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // 处理路径，确保格式正确
    let apiPath = path;
    if (apiPath.endsWith("/")) {
      apiPath = apiPath.slice(0, -1); // 移除末尾的斜杠
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${apiPath}`;

    console.log("GitHub API 请求:", {
      owner,
      repo,
      path,
      apiPath,
      url: apiUrl,
    });

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Doc-Editor",
      },
    });

    console.log("GitHub API 响应状态:", response.status, response.statusText);
    console.log("响应头:", Object.fromEntries(response.headers.entries()));

    // 检查响应内容类型
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("非JSON响应:", contentType);

      // 尝试读取响应内容来调试
      const responseText = await response.text();
      console.error("响应内容:", responseText.substring(0, 500));

      return NextResponse.json(
        {
          error: `GitHub API 返回了非JSON响应: ${contentType}`,
          status: response.status,
          details: responseText.substring(0, 200),
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error("GitHub API 错误:", errorData);
        return NextResponse.json(
          {
            error: errorData.message || "GitHub API error",
            status: response.status,
            details: errorData,
          },
          { status: response.status }
        );
      } catch (parseError) {
        console.error("解析错误响应失败:", parseError);
        return NextResponse.json(
          {
            error: `GitHub API 错误 (${response.status})`,
            status: response.status,
          },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    console.log(
      "成功获取数据:",
      Array.isArray(data) ? `${data.length} 个文件` : "单个文件"
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("GitHub API proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from GitHub API" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const token = searchParams.get("token");

  if (!owner || !repo || !path || !token) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { message, content, sha } = body;

    // 处理路径，确保格式正确
    let apiPath = path;
    if (apiPath.endsWith("/")) {
      apiPath = apiPath.slice(0, -1); // 移除末尾的斜杠
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${apiPath}`;

    console.log("GitHub API PUT 请求:", {
      owner,
      repo,
      path,
      apiPath,
      message,
      hasContent: !!content,
      hasSha: !!sha,
      url: apiUrl,
    });

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Doc-Editor",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message || `Update ${apiPath}`,
        content: content,
        sha: sha,
      }),
    });

    console.log(
      "GitHub API PUT 响应状态:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error("GitHub API PUT 错误:", errorData);
        return NextResponse.json(
          {
            error: errorData.message || "GitHub API error",
            status: response.status,
            details: errorData,
          },
          { status: response.status }
        );
      } catch (parseError) {
        console.error("解析PUT错误响应失败:", parseError);
        return NextResponse.json(
          {
            error: `GitHub API PUT 错误 (${response.status})`,
            status: response.status,
          },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    console.log("文件更新成功");
    return NextResponse.json(data);
  } catch (error) {
    console.error("GitHub API PUT proxy error:", error);
    return NextResponse.json(
      { error: "Failed to update GitHub file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log("=== DELETE方法被调用 ===");
  console.log("请求URL:", request.url);

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const token = searchParams.get("token");

  console.log("解析的参数:", { owner, repo, path, token });

  if (!owner || !repo || !path || !token) {
    console.log("缺少必需参数");
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { message, sha } = body;

    if (!message || !sha) {
      return NextResponse.json(
        { error: "Missing required fields: message, sha" },
        { status: 400 }
      );
    }

    // 处理路径，确保格式正确
    let apiPath = path;
    if (apiPath.endsWith("/")) {
      apiPath = apiPath.slice(0, -1); // 移除末尾的斜杠
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${apiPath}`;

    console.log("GitHub API DELETE 请求:", {
      owner,
      repo,
      path,
      apiPath,
      message,
      hasSha: !!sha,
      url: apiUrl,
    });

    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Doc-Editor",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        sha: sha,
      }),
    });

    console.log(
      "GitHub API DELETE 响应状态:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error("GitHub API DELETE 错误:", errorData);
        return NextResponse.json(
          {
            error: errorData.message || "GitHub API error",
            status: response.status,
            details: errorData,
          },
          { status: response.status }
        );
      } catch (parseError) {
        console.error("解析DELETE错误响应失败:", parseError);
        return NextResponse.json(
          {
            error: `GitHub API DELETE 错误 (${response.status})`,
            status: response.status,
          },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    console.log("文件删除成功");
    return NextResponse.json(data);
  } catch (error) {
    console.error("GitHub API DELETE proxy error:", error);
    return NextResponse.json(
      { error: "Failed to delete from GitHub API" },
      { status: 500 }
    );
  }
}
