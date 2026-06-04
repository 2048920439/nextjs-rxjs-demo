import { basicClient } from "./_instance";

/** GET /api/mock/random?min=0&max=1000000 → { value: number } */
export async function getRandomNumber(min = 0, max = 1000000): Promise<{ value: number }> {
  const res = await basicClient.get<{ value: number }>("/mock/random", { params: { min, max } });
  return res.data;
}

/** GET /api/mock/delay?ms=N → { success: boolean; delay: number } */
export async function getDelay(ms: number): Promise<{ success: boolean; delay: number }> {
  const res = await basicClient.get<{ success: boolean; delay: number }>("/mock/delay", { params: { ms } });
  return res.data;
}
