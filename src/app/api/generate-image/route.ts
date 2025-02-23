import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface GoogleImageItem {
  link: string;
  title: string;
  fileFormat?: string;
}

interface Image {
  url: string;
}

interface DallEImage extends Image {
  source: string;
}

interface DallEResponseData extends Image {
  url: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function searchGoogleImages(query: string): Promise<string[]> {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CX = process.env.GOOGLE_CX;

  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw new Error('Google API credentials not properly configured');
  }

  try {
    const isPngRequested = query.toLowerCase().includes('.png');
    const searchQuery = query.toLowerCase().replace('.png', '').trim();
    
    // Add random offset to get different results each time
    const randomOffset = Math.floor(Math.random() * 50); // Random start index between 0 and 50

    const searchParams = new URLSearchParams({
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      q: isPngRequested 
        ? `${searchQuery} filetype:png black background transparent` 
        : searchQuery,
      searchType: 'image',
      imgSize: 'large',
      num: '10',
      safe: 'active',
      start: randomOffset.toString(), // Add random start index
    });

    if (isPngRequested) {
      searchParams.append('fileType', 'png');
      searchParams.append('imgDominantColor', 'black');
    }

    const url = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache' // Prevent caching
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    let validImages = data.items
      .filter((item: GoogleImageItem) => {
        if (!item.link) return false;
        if (isPngRequested) {
          return item.link.toLowerCase().endsWith('.png');
        }
        return item.link.match(/\.(jpg|jpeg|png|webp)$/i) !== null;
      })
      .map((item: GoogleImageItem) => item.link);

    // Shuffle the results for additional randomization
    validImages = validImages.sort(() => Math.random() - 0.5);

    if (isPngRequested && validImages.length === 0) {
      return searchGoogleImages(searchQuery);
    }

    return validImages;

  } catch {
    throw new Error('Failed to search for images');
  }
}

async function refinePromptWithGPT4(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating detailed design prompts. Focus on creating clear, specific descriptions that will work well for DALL-E 3."
        },
        {
          role: "user",
          content: `Create a detailed DALL-E prompt based on: "${prompt}". The design should have a clear focal point.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const refinedPrompt = completion.choices[0]?.message?.content;
    
    if (!refinedPrompt) {
      console.log('GPT-4 returned empty prompt, using original');
      return prompt;
    }

    console.log('Refined prompt:', refinedPrompt);
    return refinedPrompt;
  } catch (error) {
    console.error('Error refining prompt with GPT-4:', error);
    // If there's an error, return the original prompt
    return prompt;
  }
}

async function generateAIImage(prompt: string): Promise<DallEImage[]> {
  try {
    const refinedPrompt = await refinePromptWithGPT4(prompt);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: refinedPrompt || prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural",
      response_format: "url"
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No image was generated');
    }

    // Cast the response data to the correct type
    return (response.data as DallEResponseData[]).map((image): DallEImage => ({
      url: image.url,
      source: 'dalle3'
    }));

  } catch (error) {
    console.error('AI Generation error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate AI image');
  }
}

// Keep only the route handler exports
export async function POST(req: Request) {
  try {
    const { prompt, useAI } = await req.json();

    if (!useAI) {
      // Use the searchGoogleImages function which includes randomization
      const imageUrls = await searchGoogleImages(prompt);
      
      // Transform the results into the expected format
      const images = imageUrls.map((url: string) => ({
        url: url,
        title: prompt
      }));

      return NextResponse.json({ images });
    } else {
      const aiImages = await generateAIImage(prompt);
      return NextResponse.json({ images: aiImages });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate images' },
      { status: 500 }
    );
  }
}