import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { FaqData } from "@/types";

export const dynamic = "force-dynamic";

const DATA_PATH = path.join(process.cwd(), "data", "faq.json");

export async function GET() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      const empty: FaqData = {
        categories: [],
        items: [],
        uploadedAt: null,
        fileName: null,
        brand: null,
      };
      return NextResponse.json(empty);
    }

    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data: FaqData = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to read FAQ data" },
      { status: 500 }
    );
  }
}
