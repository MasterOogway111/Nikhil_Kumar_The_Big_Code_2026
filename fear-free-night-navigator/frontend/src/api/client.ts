import axios from 'axios';
import { RouteResponse, SegmentExplanation } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
});

export async function computeRoute(
  origin: string,
  destination: string,
  time_of_day: 0 | 1 = 1,
  safety_weight?: number,  
): Promise<RouteResponse> {
  const { data } = await api.post<RouteResponse>('/route', {
    origin,
    destination,
    time_of_day,
    ...(safety_weight !== undefined && { safety_weight }), 
  });
  return data;
}

export async function explainSegment(segmentId: string): Promise<SegmentExplanation> {
  const { data } = await api.get<SegmentExplanation>(`/explain/${segmentId}`);
  return data;
}