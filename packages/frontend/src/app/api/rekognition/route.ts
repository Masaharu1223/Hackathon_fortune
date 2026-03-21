import { NextRequest, NextResponse } from 'next/server';
import { RekognitionClient, DetectTextCommand } from '@aws-sdk/client-rekognition';

// NOTE: This API route requires Next.js server mode.
// AWS credentials must be set in .env.local (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN).

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          ...(process.env.AWS_SESSION_TOKEN
            ? { sessionToken: process.env.AWS_SESSION_TOKEN }
            : {}),
        }
      : undefined,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { image?: string };
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'image is required' }, { status: 400 });
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials are not configured in .env.local' },
        { status: 500 },
      );
    }

    // Remove data URI prefix if present (data:image/jpeg;base64,...)
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    const command = new DetectTextCommand({
      Image: { Bytes: buffer },
    });

    const result = await rekognition.send(command);

    const texts = (result.TextDetections ?? [])
      .filter((d) => d.Type === 'LINE' && (d.Confidence ?? 0) > 70)
      .map((d) => d.DetectedText ?? '')
      .filter(Boolean);
    return NextResponse.json({ texts });
  } catch (err) {
    console.error('Rekognition error:', err);
    return NextResponse.json({ error: 'Recognition failed' }, { status: 500 });
  }
}
