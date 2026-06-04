import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  min: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0).max(999999)).optional(),
  max: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(1000000)).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    min: searchParams.get("min"),
    max: searchParams.get("max"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const min = parsed.data.min ?? 0;
  const max = parsed.data.max ?? 1000000;
  if (min >= max) {
    return NextResponse.json({ error: "min must be less than max" }, { status: 400 });
  }

  const value = Math.floor(Math.random() * (max - min)) + min;
  return NextResponse.json({ value, min, max });
}
