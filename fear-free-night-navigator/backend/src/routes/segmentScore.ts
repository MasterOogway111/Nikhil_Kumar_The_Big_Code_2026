import { Router } from 'express';
import { scoreOne } from '../controllers/segmentController';

const router = Router();

router.post('/', scoreOne);

export default router;
