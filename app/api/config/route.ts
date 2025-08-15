import { NextRequest, NextResponse } from "next/server";
import { configDB, ConfigRecord } from "@/lib/database";

export async function GET() {
  try {
    const config = configDB.getActive();
    if (config) {
      // 在开发环境下返回完整配置，生产环境需要更安全的处理
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        // 开发环境返回完整配置
        return NextResponse.json({ success: true, config });
      } else {
        // 生产环境不返回敏感信息
        const { token, ...safeConfig } = config;
        return NextResponse.json({ success: true, config: safeConfig });
      }
    }
    return NextResponse.json({
      success: false,
      message: "No active config found",
    });
  } catch (error) {
    console.error("获取配置失败:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get config" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, token, path } = body;

    if (!owner || !repo || !token || !path) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const config: ConfigRecord = {
      owner,
      repo,
      token,
      path,
      is_active: true,
    };

    configDB.save(config);

    return NextResponse.json({
      success: true,
      message: "Config saved successfully",
      config: { owner, repo, path }, // 不返回token
    });
  } catch (error) {
    console.error("保存配置失败:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save config" },
      { status: 500 }
    );
  }
}
