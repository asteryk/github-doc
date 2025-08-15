import { NextRequest, NextResponse } from "next/server";
import { documentDB, DocumentRecord } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (path) {
      const doc = documentDB.get(path);
      if (doc) {
        return NextResponse.json({ success: true, document: doc });
      }
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // 获取所有文档
    const documents = documentDB.getAll();
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error("获取文档失败:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, name, content, sha } = body;

    if (!path || !name) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const doc: DocumentRecord = {
      path,
      name,
      content: content || "",
      sha: sha || "",
    };

    documentDB.save(doc);

    return NextResponse.json({
      success: true,
      message: "Document saved successfully",
      document: doc,
    });
  } catch (error) {
    console.error("保存文档失败:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save document" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { success: false, message: "Path is required" },
        { status: 400 }
      );
    }

    documentDB.delete(path);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("删除文档失败:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete document" },
      { status: 500 }
    );
  }
}
