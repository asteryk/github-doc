import { NextRequest, NextResponse } from "next/server";

// 由于 IndexedDB 是客户端技术，配置 API 路由主要用于兼容性
// 实际配置操作将在客户端完成

export async function GET() {
  // IndexedDB 操作需要在客户端进行
  return NextResponse.json(
    {
      success: false,
      message: "请使用客户端 IndexedDB 操作",
      note: "配置已迁移到客户端 IndexedDB，请直接在前端调用 configDB 相关函数",
    },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  // IndexedDB 操作需要在客户端进行
  return NextResponse.json(
    {
      success: false,
      message: "请使用客户端 IndexedDB 操作",
      note: "配置已迁移到客户端 IndexedDB，请直接在前端调用 configDB 相关函数",
    },
    { status: 501 }
  );
}
