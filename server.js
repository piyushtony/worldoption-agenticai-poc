import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Save input.json endpoint
app.post('/api/save-input', async (req, res) => {
  try {
    const data = req.body;
    const filePath = path.join(__dirname, 'public', 'input.json');
    const backupPath = path.join(__dirname, 'public', 'backup-input.json');
    
    // First, read current input.json and save it to backup (before overwriting)
    try {
      const currentInput = await fs.readFile(filePath, 'utf8');
      await fs.writeFile(backupPath, currentInput, 'utf8');
    } catch (err) {
      // If input.json doesn't exist yet, create backup with current data
      await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf8');
    }
    
    // Then save the new data to input.json
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    res.json({ success: true, message: 'input.json saved successfully. backup-input.json updated with previous version.' });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset input.json from backup endpoint
app.post('/api/reset-input', async (req, res) => {
  try {
    const backupPath = path.join(__dirname, 'public', 'backup-input.json');
    const inputPath = path.join(__dirname, 'public', 'input.json');
    
    // Read backup file
    const backupData = await fs.readFile(backupPath, 'utf8');
    
    // Write to input.json
    await fs.writeFile(inputPath, backupData, 'utf8');
    
    res.json({ success: true, message: 'input.json reset from backup successfully', data: JSON.parse(backupData) });
  } catch (error) {
    console.error('Error resetting file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`File server running on http://localhost:${PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, 'public')}`);
});
