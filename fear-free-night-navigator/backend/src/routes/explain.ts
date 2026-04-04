import { Router } from 'express';
import Segment from '../models/Segment';

const router = Router();

router.get('/:segmentId', async (req, res) => {
  try {
    const seg = await Segment.findOne({ segmentId: req.params.segmentId });
    if (!seg) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const { features, risk_score, uncertainty } = seg;
    const explanations: string[] = [];

    if (features.poi_density < 0.2) {
      explanations.push('Low activity area — few businesses or people nearby');
    }
    if (features.road_isolation > 0.7) {
      explanations.push('Isolated road — limited connectivity to other streets');
    }
    if (features.lighting_proxy < 0.3) {
      explanations.push('Potentially poorly lit — low commercial presence');
    }
    if (features.time_of_day === 1) {
      explanations.push('Night-time travel increases risk');
    }
    if (features.commercial_activity < 0.2) {
      explanations.push('Minimal commercial activity in this area');
    }
    if (uncertainty > 0.3) {
      explanations.push('Limited data available — risk estimate is uncertain');
    }

    return res.json({
      segmentId: seg.segmentId,
      risk_score,
      uncertainty,
      explanations,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch explanation', message: error.message });
  }
});

export default router;
