// backend/index.js
import express from 'express';
import multer from 'multer';
import fs,{existsSync} from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { readFile, writeFile } from 'fs/promises';
import fetch from 'node-fetch';
import { createOCRClient } from 'tesseract-wasm/node';
import sharp from "sharp";
import OpenAI from 'openai';
import cors from 'cors';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.use(cors());


async function loadImage(buffer) {
  const image = await sharp(buffer).ensureAlpha();
  const { width, height } = await image.metadata();
  return {
    data: await image.raw().toBuffer(),
    width,
    height,
  };
}

// Function to load the Tesseract OCR model
async function loadModel() {
  const modelPath = 'eng.traineddata';
  if (!existsSync(modelPath)) {
    console.log('Downloading text recognition model...');
    const modelURL = 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata';
    const response = await fetch(modelURL);
    if (!response.ok) {
      process.stderr.write(`Failed to download model from ${modelURL}`);
      process.exit(1);
    }
    const data = await response.arrayBuffer();
    await writeFile(modelPath, new Uint8Array(data));
  }
  return readFile(modelPath);
}

app.post('/api/upload', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;
console.log(imagePath)
  // Start a new OCR client
  const client = createOCRClient();

  try {
    // Load the OCR model concurrently with reading the image
    const modelLoaded = loadModel().then((model) => client.loadModel(model));


    
    await modelLoaded;
    await client.loadImage(await loadImage(imagePath));
    const text = await client.getText();
    console.log('OCR text: ', text);

 
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: text + ` 
        (fill this and only show this output {
name:"",
board:"",
totalMarks:"",
college:"",
city:"",
group:"",
      } group comes from top its like science, pre-engineering,medical or etc 
  show totalmarks in numbers
  dont show character , in any field)
  `}]
    });

    
    //fs.unlink(imagePath, (err) => {
     // if (err) console.error(err);
    //});

   console.log(gptResponse.choices[0])
   res.json({ response: gptResponse.choices[0].message.content });
    //res.status(200).json({ response: text });
  } catch (error) {
    
    res.status(500).json({ error: 'Failed to process the image' });
  } finally {
   
    client.destroy();
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
