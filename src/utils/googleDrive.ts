import { google } from 'googleapis';

// Initialize the Google Drive client
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

export async function uploadDesignToGoogleDrive(
  imageData: string,
  fileName: string,
  isFrontDesign: boolean
) {
  try {
    // Remove the data URL prefix to get just the base64 data
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const folderId = isFrontDesign 
      ? process.env.GOOGLE_DRIVE_FRONT_FOLDER_ID 
      : process.env.GOOGLE_DRIVE_BACK_FOLDER_ID;

    const fileMetadata = {
      name: fileName,
      parents: [folderId!],
    };

    const media = {
      mimeType: 'image/png',
      body: buffer,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,webViewLink',
    });

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload to Google Drive');
  }
}

export async function getDesignsFromFolder(isFrontDesign: boolean) {
  try {
    const folderId = isFrontDesign 
      ? process.env.GOOGLE_DRIVE_FRONT_FOLDER_ID 
      : process.env.GOOGLE_DRIVE_BACK_FOLDER_ID;

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, webViewLink, thumbnailLink)',
    });

    return response.data.files;
  } catch (error) {
    console.error('Error fetching designs from Google Drive:', error);
    throw error;
  }
}