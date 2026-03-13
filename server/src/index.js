import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analyzeRoute from './routes/analyzeRoute.js';
import githubRoute from './routes/githubRoute.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/github', githubRoute);
app.use('/api/analyze', analyzeRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`AgentLens server running on port ${PORT}`);
});