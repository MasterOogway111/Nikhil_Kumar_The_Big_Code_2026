import { Router } from 'express';

const router = Router();

router.get('/', (_, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'fear-free-night-navigator-backend',
  });
});

export default router;
