import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Achievements coming soon' });
});

export default router;
