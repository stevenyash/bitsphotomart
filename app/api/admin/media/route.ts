import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mediaManager } from "@/lib/media-manager";
import { hasPermission } from "@/lib/rbac";

// GET - List all files in S3 with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('content.media.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - content.media.manage permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "";
    const prefix = folder ? `${folder}/` : "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const continuationToken = searchParams.get("token") || undefined;

    // Get files with pagination
    const result = await mediaManager.listFilesPaginated(prefix, limit, continuationToken);

    // Get file details
    const fileDetails = await Promise.all(
      result.files.map(async (key) => {
        const exists = await mediaManager.exists(key);
        const metadata = exists ? await mediaManager.getMetadata(key) : null;
        
        return {
          key,
          url: mediaManager.getCloudFrontUrl(key),
          size: metadata?.["content-length"] ? parseInt(metadata["content-length"]) : 0,
          lastModified: metadata?.["last-modified"] || null,
          contentType: metadata?.["content-type"] || "unknown",
        };
      })
    );

    // Group by folder (only for first page without token)
    const groupedFiles: Record<string, typeof fileDetails> = {};
    if (!continuationToken) {
      fileDetails.forEach((file) => {
        const folder = file.key.split("/")[0] || "root";
        if (!groupedFiles[folder]) {
          groupedFiles[folder] = [];
        }
        groupedFiles[folder].push(file);
      });
    }

    // Get total count for accurate pagination
    const totalCount = await mediaManager.getFileCount(prefix);

    return NextResponse.json({ 
      files: fileDetails, 
      groupedFiles,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        nextToken: result.nextToken,
      }
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

// DELETE - Delete a file from S3
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('content.media.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - content.media.manage permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "File key is required" }, { status: 400 });
    }

    const result = await mediaManager.delete(key);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete file" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
