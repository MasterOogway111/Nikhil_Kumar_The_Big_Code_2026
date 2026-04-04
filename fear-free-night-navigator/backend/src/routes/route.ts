import { Router } from 'express';
import { computeRoutes } from '../controllers/routeController';

const router = Router();

router.post('/', computeRoutes);

export default router;
