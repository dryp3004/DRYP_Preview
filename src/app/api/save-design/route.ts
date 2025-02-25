import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { drive_v3 } from 'googleapis/build/src/apis/drive/v3';
import { Readable } from 'stream';

// Google Drive credentials
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL ?? '';
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID ?? '';

// Add debug logging
console.log('Checking credentials:', {
  hasPrivateKey: !!GOOGLE_PRIVATE_KEY,
  hasClientEmail: !!GOOGLE_CLIENT_EMAIL,
  hasFolderId: !!GOOGLE_DRIVE_FOLDER_ID
});

if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_DRIVE_FOLDER_ID) {
  throw new Error('Missing required Google Drive credentials');
}

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
    console.log('Starting file upload process...');
    
    const { frontImage, backImage, fileName, customerName, phoneNumber } = await req.json();

    // Validate input
    if (!frontImage || !backImage || !fileName) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert base64 images to Buffers and then to streams
    const frontBuffer = Buffer.from(frontImage.split(',')[1], 'base64');
    const backBuffer = Buffer.from(backImage.split(',')[1], 'base64');

    console.log('Uploading front image...');
    // Upload front view
    const frontResponse = await drive.files.create({
      requestBody: {
        name: `${fileName}-front.png`,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
        mimeType: 'image/png'
      },
      media: {
        mimeType: 'image/png',
        body: bufferToStream(frontBuffer)
      }
    } as drive_v3.Params$Resource$Files$Create);

    console.log('Front image uploaded, uploading back image...');
    // Upload back view
    const backResponse = await drive.files.create({
      requestBody: {
        name: `${fileName}-back.png`,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
        mimeType: 'image/png'
      },
      media: {
        mimeType: 'image/png',
        body: bufferToStream(backBuffer)
      }
    } as drive_v3.Params$Resource$Files$Create);

    console.log('Back image uploaded, creating metadata...');
    // Create metadata file
    const metadata = {
      customerName,
      phoneNumber,
      timestamp: new Date().toISOString(),
      frontImageId: frontResponse.data?.id,
      backImageId: backResponse.data?.id
    };

    const metadataString = JSON.stringify(metadata, null, 2);
    await drive.files.create({
      requestBody: {
        name: `${fileName}-metadata.json`,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
        mimeType: 'application/json'
      },
      media: {
        mimeType: 'application/json',
        body: metadataString // Use string directly for JSON
      }
    } as drive_v3.Params$Resource$Files$Create);

    console.log('Upload process completed successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Detailed error in Google Drive upload:', error);
    
    // More detailed error response
    let errorMessage = 'Failed to save design to Google Drive';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}