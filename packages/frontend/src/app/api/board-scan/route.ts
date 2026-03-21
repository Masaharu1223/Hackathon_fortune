import { NextRequest, NextResponse } from 'next/server';
import { RekognitionClient, DetectTextCommand } from '@aws-sdk/client-rekognition';

export interface BoardScanResult {
  success: boolean;
  prizes: {
    rank: string;
    count: number;
  }[];
  totalDetected: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<BoardScanResult>> {
  try {
    const body = (await request.json()) as { image?: string };
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, prizes: [], totalDetected: 0, error: 'No image provided' },
        { status: 400 },
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { success: false, prizes: [], totalDetected: 0, error: 'AWS credentials are not configured' },
        { status: 500 },
      );
    }

    // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,")
    const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '');

    const client = new RekognitionClient({
      region: process.env.AWS_REGION ?? 'ap-northeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN
          ? { sessionToken: process.env.AWS_SESSION_TOKEN }
          : {}),
      },
    });

    const command = new DetectTextCommand({
      Image: {
        Bytes: Buffer.from(base64Image, 'base64'),
      },
    });

    const response = await client.send(command);

    // Debug: log all detected text to understand what Rekognition sees
    console.log('[board-scan] Raw detections:');
    for (const d of response.TextDetections ?? []) {
      console.log(`  [${d.Type}] "${d.DetectedText}" (conf: ${d.Confidence?.toFixed(1)})`);
    }

    // Count prize ranks: half-tickets show a single letter (e.g. "A", "B", "C")
    // Only count WORD-type to avoid double-counting (LINE duplicates WORD detections)
    // Confidence threshold of 75 to balance noise vs. missed detections
    // Accept lowercase too since Rekognition sometimes returns 'a' instead of 'A'
    const prizeCounts: Record<string, number> = {};
    for (const detection of response.TextDetections ?? []) {
      if (detection.Type !== 'WORD') continue;
      if ((detection.Confidence ?? 0) < 75) continue;
      const text = (detection.DetectedText ?? '').trim();
      if (/^[A-Za-z]$/.test(text)) {
        const rank = text.toUpperCase();
        prizeCounts[rank] = (prizeCounts[rank] ?? 0) + 1;
      }
    }

    console.log('[board-scan] prizeCounts:', prizeCounts);

    const prizes = Object.entries(prizeCounts)
      .map(([rank, count]) => ({ rank, count }))
      .sort((a, b) => a.rank.localeCompare(b.rank));
    const totalDetected = prizes.reduce((sum, p) => sum + p.count, 0);

    return NextResponse.json({ success: true, prizes, totalDetected });
  } catch (err) {
    console.error('Board scan error:', err);
    return NextResponse.json(
      {
        success: false,
        prizes: [],
        totalDetected: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
