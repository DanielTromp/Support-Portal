import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseFaqText } from "@/lib/parse-pdf";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_PATH = path.join(DATA_DIR, "faq.json");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamic import to avoid issues with pdf-parse ESM
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    const faqData = parseFaqText(text, file.name);

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write to file (replaces previous data)
    fs.writeFileSync(DATA_PATH, JSON.stringify(faqData, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      categoriesCount: faqData.categories.length,
      itemsCount: faqData.items.length,
      fileName: file.name,
      hasBrand: faqData.brand !== null,
      companyName: faqData.brand?.companyName ?? null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
