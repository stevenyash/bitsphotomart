/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

// GET - Get all categories
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('content.categories.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - content.categories.manage permission required' }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    // Get photo counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await prisma.photo.count({
          where: { category: cat.slug },
        });
        return { ...cat, photoCount: count };
      })
    );

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new category
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('content.categories.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - content.categories.manage permission required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existingCategory) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || "",
        slug: slug.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update category
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('content.categories.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - content.categories.manage permission required' }, { status: 403 });
    }

    const body = await request.json();
    const { categoryId, name, description, slug } = body;

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (slug) {
      updateData.slug = slug.toLowerCase().replace(/[^a-z0-9]/g, "-");
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete category
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('content.categories.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - content.categories.manage permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
    }

    // Check if category has photos
    const photoCount = await prisma.photo.count({
      where: { category: categoryId },
    });

    if (photoCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with photos. Remove photos first." },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
