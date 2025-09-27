'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const mockHeatmapData = [
  { name: 'Ahmed Al-Mansoori', courses: [85, 92, 78, 95, 88] },
  { name: 'Fatima Al-Zahra', courses: [92, 88, 95, 82, 90] },
  { name: 'Khalid Al-Rashid', courses: [78, 85, 92, 88, 85] },
  { name: 'Omar Al-Hamad', courses: [95, 90, 88, 92, 87] },
  { name: 'Sara Al-Mahmoud', courses: [88, 95, 85, 90, 92] },
  { name: 'Mohammed Al-Khalifa', courses: [82, 78, 88, 85, 90] },
  { name: 'Noor Al-Sulaiti', courses: [90, 92, 95, 88, 85] },
  { name: 'Ali Al-Thani', courses: [85, 88, 82, 90, 92] },
];

const courseNames = [
  'Crowd Mgmt',
  'Radio Comm',
  'Evidence',
  'Security',
  'Emergency'
];

export function Heatmap() {
  const getHeatmapColor = (value: number) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 80) return 'bg-green-400';
    if (value >= 70) return 'bg-yellow-400';
    if (value >= 60) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getTextColor = (value: number) => {
    return value >= 70 ? 'text-white' : 'text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Training Completion Heatmap</span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>90-100%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span>70-89%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-400 rounded"></div>
            <span>60-69%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>&lt;60%</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="grid grid-cols-6 gap-1 mb-2">
            <div className="text-sm font-medium text-muted-foreground p-2">
              Personnel
            </div>
            {courseNames.map((course) => (
              <div
                key={course}
                className="text-xs font-medium text-muted-foreground p-2 text-center"
              >
                {course}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {mockHeatmapData.map((personnel, index) => (
            <div key={index} className="grid grid-cols-6 gap-1 mb-1">
              <div className="text-sm font-medium p-2 truncate" title={personnel.name}>
                {personnel.name.split(' ')[0]}
              </div>
              {personnel.courses.map((score, courseIndex) => (
                <div
                  key={courseIndex}
                  className={cn(
                    'flex items-center justify-center text-xs font-medium rounded p-2 min-h-[2rem]',
                    getHeatmapColor(score),
                    getTextColor(score)
                  )}
                  title={`${courseNames[courseIndex]}: ${score}%`}
                >
                  {score}%
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center pt-2 border-t">
        Showing training completion across {mockHeatmapData.length} personnel for {courseNames.length} courses
      </div>
    </div>
  );
}
