import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const data = await request.formData();
    const files = data.getAll('images');

    if (!files || files.length === 0) {
      return Response.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedUrls = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const filename = `${Date.now()}-${file.name}`;
      const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

      await writeFile(filepath, buffer);

      const url = `/uploads/${filename}`;

      uploadedUrls.push({
        original: url,
        thumb: url, // For now, same as original
      });
    }

    return Response.json(uploadedUrls);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}