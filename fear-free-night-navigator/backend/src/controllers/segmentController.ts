import { Request, Response } from 'express';
import { scoreSegment } from '../services/segmentScorer';

export const scoreOne = async (req: Request, res: Response) => {
  try {
    const { segmentId, polyline, features } = req.body;

    if (!segmentId || !features) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'segmentId and features are required',
      });
    }

    console.log(`Scoring segment: ${segmentId}`);

    // Score the segment
    const { risk_score, uncertainty } = await scoreSegment(
      segmentId,
      polyline || '',
      features
    );

    return res.json({
      segmentId,
      risk_score,
      uncertainty,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in scoreOne:', err.message);
    return res.status(500).json({
      error: 'Segment scoring failed',
      message: err.message,
    });
  }
};
