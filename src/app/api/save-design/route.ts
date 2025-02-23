import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

/* eslint-disable @typescript-eslint/no-unused-vars */

// Helper function to convert Buffer to Stream
function bufferToStream(buffer: Buffer) {
  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });
}

export async function POST(req: Request) {
  try {
    const { frontImage, backImage, fileName } = await req.json();

    if (!frontImage || !backImage || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Save front view
    const frontBuffer = Buffer.from(frontImage.split(',')[1], 'base64');
    const frontStream = bufferToStream(frontBuffer);
    
    await drive.files.create({
      requestBody: {
        name: `${fileName}-front.png`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: 'image/png',
        body: frontStream,
      },
    });

    // Save back view
    const backBuffer = Buffer.from(backImage.split(',')[1], 'base64');
    const backStream = bufferToStream(backBuffer);
    
    await drive.files.create({
      requestBody: {
        name: `${fileName}-back.png`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: 'image/png',
        body: backStream,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving to Google Drive:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save design',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}