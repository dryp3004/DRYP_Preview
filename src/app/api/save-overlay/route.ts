import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { drive_v3 } from 'googleapis/build/src/apis/drive/v3';
import { Readable } from 'stream';

// Google Drive credentials
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL ?? '';
const GOOGLE_DRIVE_OVERLAYS_FOLDER_ID = process.env.GOOGLE_DRIVE_OVERLAYS_FOLDER_ID ?? '';

// Initialize Google Drive client
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    private_key: GOOGLE_PRIVATE_KEY,
    client_email: GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    universe_domain: 'googleapis.com'
  },
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

const drive = google.drive({ version: 'v3', auth });

// Helper function to convert Buffer to Readable stream
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(req: Request) {
  try {
    const { overlayImage, fileName, position } = await req.json();

    // Validate input
    if (!overlayImage || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert base64 image to Buffer and then to stream
    const overlayBuffer = Buffer.from(overlayImage.split(',')[1], 'base64');

    // Upload overlay
    const overlayResponse = await drive.files.create({
      requestBody: {
        name: `overlay-${fileName}-${position || 'unnamed'}.png`,
        parents: [GOOGLE_DRIVE_OVERLAYS_FOLDER_ID],
        mimeType: 'image/png'
      },
      media: {
        mimeType: 'image/png',
        body: bufferToStream(overlayBuffer)
      }
    } as drive_v3.Params$Resource$Files$Create);

    // Create metadata for the overlay
    const metadata = {
      fileName,
      position,
      timestamp: new Date().toISOString(),
      overlayId: overlayResponse.data?.id
    };

    // Create metadata file for the overlay
    const metadataString = JSON.stringify(metadata, null, 2);
    await drive.files.create({
      requestBody: {
        name: `overlay-${fileName}-${position || 'unnamed'}-metadata.json`,
        parents: [GOOGLE_DRIVE_OVERLAYS_FOLDER_ID],
        mimeType: 'application/json'
      },
      media: {
        mimeType: 'application/json',
        body: metadataString
      }
    } as drive_v3.Params$Resource$Files$Create);

    return NextResponse.json({ 
      success: true,
      fileId: overlayResponse.data?.id
    });

  } catch (error) {
    console.error('Error saving overlay to Google Drive:', error);
    
    let errorMessage = 'Failed to save overlay to Google Drive';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}