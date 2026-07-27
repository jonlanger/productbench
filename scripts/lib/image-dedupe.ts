import { createHash } from "crypto";
import { readFileSync, unlinkSync } from "fs";
import sharp from "sharp";

const HASH_SIZE = 8;

/** Difference hash (dHash) as hex string. */
export async function perceptualHash(filePath: string): Promise<string> {
  const { data, info } = await sharp(filePath)
    .grayscale()
    .resize(HASH_SIZE + 1, HASH_SIZE, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bits: number[] = [];
  const rowWidth = info.width;

  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      const left = data[y * rowWidth + x]!;
      const right = data[y * rowWidth + x + 1]!;
      bits.push(left < right ? 1 : 0);
    }
  }

  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    const nibble =
      (bits[i]! << 3) |
      (bits[i + 1]! << 2) |
      (bits[i + 2]! << 1) |
      bits[i + 3]!;
    hex += nibble.toString(16);
  }
  return hex;
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = parseInt(a[i]!, 16) ^ parseInt(b[i]!, 16);
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

export function contentHash(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export type ShotDedupeResult = {
  unique: boolean;
  phash: string;
  sha256: string;
  width: number;
  height: number;
};

export class ShotDedupeRegistry {
  private readonly phashes: string[] = [];
  private readonly sha256s = new Set<string>();

  constructor(
    private readonly maxHamming = 10,
    private readonly onDuplicate?: (filePath: string) => void,
  ) {}

  async register(filePath: string): Promise<ShotDedupeResult> {
    const meta = await sharp(filePath).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const sha256 = contentHash(filePath);
    const phash = await perceptualHash(filePath);

    if (this.sha256s.has(sha256)) {
      this.onDuplicate?.(filePath);
      return { unique: false, phash, sha256, width, height };
    }

    for (const existing of this.phashes) {
      if (hammingDistance(phash, existing) <= this.maxHamming) {
        this.onDuplicate?.(filePath);
        return { unique: false, phash, sha256, width, height };
      }
    }

    this.sha256s.add(sha256);
    this.phashes.push(phash);
    return { unique: true, phash, sha256, width, height };
  }

  removeDuplicate(filePath: string) {
    try {
      unlinkSync(filePath);
    } catch {
      /* already gone */
    }
  }
}
