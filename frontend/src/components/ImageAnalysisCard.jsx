import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Camera, Eye } from 'lucide-react';

export function ImageAnalysisCard({ imageAnalysis }) {
  if (!imageAnalysis || imageAnalysis.photos_analyzed === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 mb-6" data-testid="image-analysis-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-400" />
            Image Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">No photos were uploaded for analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getColor = (score) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const photoCount = imageAnalysis.photos_analyzed;
  const consistencyScore = imageAnalysis.consistency_score;
  const authenticityScore = imageAnalysis.authenticity_score;
  const verdict = imageAnalysis.overall_photo_verdict || 'No verdict';

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 mb-6" data-testid="image-analysis-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-teal-400" />
          Image Analysis
          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 ml-2">
            {photoCount} analyzed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 text-center">
            <p className="text-zinc-400 text-sm mb-1">Consistency</p>
            <p className={`text-2xl font-bold ${getColor(consistencyScore || 0)}`}>
              {consistencyScore ?? 'N/A'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 text-center">
            <p className="text-zinc-400 text-sm mb-1">Authenticity</p>
            <p className={`text-2xl font-bold ${getColor(authenticityScore || 0)}`}>
              {authenticityScore ?? 'N/A'}
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-800/50">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <div>
              <p className="text-teal-300 font-medium">Assessment</p>
              <p className="text-teal-400/80 text-sm mt-1">{verdict}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
