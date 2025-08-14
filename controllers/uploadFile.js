// import fetch from 'node-fetch';
// import FormData from 'form-data';

const FormData = require("form-data");
const { default: fetch } = require("node-fetch");

 async function downloadAndUpload(req, res) {
  try {
    const { tensorArtUrl, loginCode } = req.body;
    const apiUrl = 'https://nftdata.lightningworks.io/creator/restapi';

    // 1️⃣ Download image from Tensor Art
    const imageResponse = await fetch(tensorArtUrl);
    if (!imageResponse.ok) {
      return res.status(400).json({ error: 'Failed to download image from Tensor Art' });
    }
    const buffer = await imageResponse.buffer();

    // 2️⃣ Prepare upload to your backend
    const formData = new FormData();
    formData.append('loginCode', loginCode);
    formData.append('op', 'file-upload');
    formData.append('file', buffer, {
      filename: `ai_image_${Date.now()}.png`,
      contentType: 'image/png'
    });

    // 3️⃣ Upload to backend storage
    const uploadResponse = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });
    let imageUrl = await uploadResponse.text();
    imageUrl = imageUrl?.replace(/^"|"$/g, '');

    // 4️⃣ Send permanent URL back to frontend
    res.json({ permanentUrl: imageUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}




module.exports = { downloadAndUpload };
