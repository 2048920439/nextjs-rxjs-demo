import { NextResponse } from "next/server";
import { z } from "zod";

import { sleep } from "@/shared/utils/promise";

const querySchema = z.object({
  ms: z.string().regex(/^\d+$/, "ms must be a positive integer").transform(Number).pipe(z.number().min(0).max(10000)),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const msStr = searchParams.get("ms");

    const parsed = querySchema.safeParse({ ms: msStr });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { ms } = parsed.data;

    await sleep(ms);

    return NextResponse.json({ success: true, delay: ms });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
