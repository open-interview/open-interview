/**
 * Format Metrics Dashboard Component
 * 
 * This component provides a comprehensive dashboard for viewing
 * answer formatting metrics, compliance rates, and trends.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  metricsCollector, 
  FormatMetrics as FormatMetricsType, 
  MetricsTrend, 
  PatternUsageStats, 
  ChannelMetrics 
} from '../../lib/answer-formatting/metrics-collector';

// ============================================================================
// Types
// ============================================================================

interface FormatMetricsProps {
  className?: string;
  refreshInterval?: number; // Auto-refresh interval in ms
}

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

interface TrendChartProps {
  trends: MetricsTrend[];
  metric: 'complianceRate' | 'validationPassRate' | 'autoFixSuccessRate';
  title: string;
}

// ============================================================================
// Metric Card Component
// ============================================================================

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  trend, 
  className = '' 
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val % 1 === 0) return val.toString();
      return val.toFixed(1);
    }
    return val;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return '';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {formatValue(value)}
            {typeof value === 'number' && value <= 100 && '%'}
          </div>
          {trend && (
            <div className={`text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Trend Chart Component
// ============================================================================

const TrendChart: React.FC<TrendChartProps> = ({ trends, metric, title }) => {
  const maxValue = Math.max(...trends.map(t => t[metric]));
  const minValue = Math.min(...trends.map(t => t[metric]));
  const range = maxValue - minValue || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Last 30 days trend</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-32 flex items-end space-x-1">
          {trends.slice(-14).map((trend, index) => {
            const height = ((trend[metric] - minValue) / range) * 100;
            const date = new Date(trend.date);
            const dayLabel = date.getDate().toString();
            
            return (
              <div key={trend.date} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${trend.date}: ${trend[metric].toFixed(1)}%`}
                />
                <div className="text-xs text-gray-500 mt-1">{dayLabel}</div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{minValue.toFixed(1)}%</span>
          <span>{maxValue.toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Pattern Usage Component
// ============================================================================

const PatternUsageTable: React.FC<{ patternUsage: PatternUsageStats }> = ({ patternUsage }) => {
  const patterns = Object.entries(patternUsage).sort((a, b) => b[1].detectionCount - a[1].detectionCount);

  if (patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pattern Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No pattern usage data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pattern Usage Statistics</CardTitle>
        <CardDescription>Detection and application rates by pattern</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patterns.map(([patternId, stats]) => (
            <div key={patternId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{stats.name}</h4>
                <Badge variant="secondary">
                  {stats.detectionCount} detections
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Application Rate</div>
                  <div className="font-medium">
                    {stats.detectionCount > 0 
                      ? ((stats.applicationCount / stats.detectionCount) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Success Rate</div>
                  <div className="font-medium">{stats.successRate.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="mt-2">
                <div className="text-gray-600 text-sm">Average Score</div>
                <Progress value={stats.averageScore} className="mt-1" />
                <div className="text-xs text-gray-500 mt-1">
                  {stats.averageScore.toFixed(1)}/100
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Channel Breakdown Component
// ============================================================================

const ChannelBreakdown: React.FC<{ channels: ChannelMetrics[] }> = ({ channels }) => {
  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Channel Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No channel data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Performance</CardTitle>
        <CardDescription>Formatting compliance by channel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {channels.map((channel) => (
            <div key={channel.channel} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize">{channel.channel}</h4>
                <Badge variant="outline">
                  {channel.totalQuestions} questions
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-gray-600 text-sm">Compliance Rate</div>
                  <div className="font-medium">{channel.complianceRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm">Average Score</div>
                  <div className="font-medium">{channel.averageScore.toFixed(1)}</div>
                </div>
              </div>
              
              <Progress value={channel.complianceRate} className="mb-2" />
              
              {channel.topPatterns.length > 0 && (
                <div>
                  <div className="text-gray-600 text-sm mb-1">Top Patterns</div>
                  <div className="flex flex-wrap gap-1">
                    {channel.topPatterns.map((pattern) => (
                      <Badge key={pattern} variant="secondary" className="text-xs">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main FormatMetrics Component
// ============================================================================

export const FormatMetricsDashboard: React.FC<FormatMetricsProps> = ({ 
  className = '',
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [metrics, setMetrics] = useState<FormatMetricsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load metrics
  const loadMetrics = async () => {
    try {
      setLoading(true);
      const currentMetrics = metricsCollector.getMetrics();
      setMetrics(currentMetrics);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    loadMetrics();
    
    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Manual refresh
  const handleRefresh = () => {
    loadMetrics();
  };

  // Clear metrics (for testing)
  const handleClearMetrics = () => {
    if (confirm('Are you sure you want to clear all metrics? This action cannot be undone.')) {
      metricsCollector.clearMetrics();
      loadMetrics();
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>Failed to load metrics</p>
          <Button onClick={handleRefresh} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Answer Formatting Metrics</h1>
          <p className="text-gray-600">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="outline" onClick={handleClearMetrics}>
            Clear Data
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Questions"
          value={metrics.totalQuestions}
          description="Questions analyzed"
        />
        <MetricCard
          title="Compliance Rate"
          value={metrics.complianceRate}
          description="Questions passing validation"
        />
        <MetricCard
          title="Average Score"
          value={metrics.averageScore}
          description="Overall formatting quality"
        />
        <MetricCard
          title="Auto-Fix Success"
          value={metrics.autoFixSuccessRate}
          description="Violations successfully fixed"
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Validation Pass Rate"
          value={metrics.validationPassRate}
          description="First-attempt validation success"
        />
        <MetricCard
          title="Average Violations"
          value={metrics.averageViolationsPerQuestion}
          description="Per question"
        />
        <MetricCard
          title="Auto-Fix Attempts"
          value={metrics.autoFixAttempts}
          description="Total fix attempts"
        />
        <MetricCard
          title="Auto-Fix Successes"
          value={metrics.autoFixSuccesses}
          description="Successful fixes"
        />
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TrendChart
              trends={metrics.trends}
              metric="complianceRate"
              title="Compliance Rate Trend"
            />
            <TrendChart
              trends={metrics.trends}
              metric="validationPassRate"
              title="Validation Pass Rate Trend"
            />
          </div>
          <TrendChart
            trends={metrics.trends}
            metric="autoFixSuccessRate"
            title="Auto-Fix Success Rate Trend"
          />
        </TabsContent>

        <TabsContent value="patterns">
          <PatternUsageTable patternUsage={metrics.patternUsage} />
        </TabsContent>

        <TabsContent value="channels">
          <ChannelBreakdown channels={metrics.channelBreakdown} />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="text-xs text-gray-500 border-t pt-4">
        <p>
          Metrics are automatically collected and updated in real-time. 
          Data is stored locally in your browser.
        </p>
        <p className="mt-1">
          Refresh interval: {refreshInterval / 1000}s | 
          Last refresh: {lastRefresh.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default FormatMetricsDashboard;