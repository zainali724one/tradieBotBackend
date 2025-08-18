// const FormData = require("form-data");

// import { createClient } from "@supabase/supabase-js";

const { createClient } = require("@supabase/supabase-js");

// 🔹 Your Supabase credentials
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

const supabase = createClient(
  "https://dwnobjuzokczdcbbyubz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bm9ianV6b2tjemRjYmJ5dWJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE2NTU0NSwiZXhwIjoyMDY1NzQxNTQ1fQ._6ULaGf5RmKRp2TboIyXO0iaJlCleo7lZYp1bhzvNfQ"
);

async function saveTensorArtImage(
  tensorArtUrl,
  fileName = `ai-${Date.now()}.png`
) {
  try {
    // 1. Download the image from TensorArt URL
    const response = await fetch(tensorArtUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Upload it to Supabase Storage
    const { data, error } = await supabase.storage
      .from("aiGenImgs") // 👈 replace with your bucket name
      .upload(`ai-images/${fileName}`, buffer, {
        contentType: "image/png", // or "image/jpeg" if needed
        upsert: true,
      });

    if (error) throw error;

    console.log("✅ Uploaded to Supabase:", data);

    // 3. (Optional) Generate a public URL
    const { data: publicUrlData } = supabase.storage
      .from("aiGenImgs")
      .getPublicUrl(`ai-images/${fileName}`);

    console.log("🌍 Public URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("❌ Error saving image:", err.message);
    throw err;
  }
}

async function downloadAndUpload(req, res) {
  try {
    const { tensorArtUrl } = req.body;

    const imageUrl = await saveTensorArtImage(
      tensorArtUrl,
      `ai-${Date.now()}.png`
    );
    res.json({ permanentUrl: imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = { downloadAndUpload };
