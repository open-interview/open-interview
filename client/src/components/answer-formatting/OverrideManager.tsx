/**
 * Override Manager Component for Answer Formatting Standards
 * 
 * This component provides functionality for managing manual overrides
 * of formatting patterns, including adding justifications and tracking usage.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { 
  configurationManager, 
  OverrideRecord 
} from '../../lib/answer-formatting/configuration-manager';
import { FormatPattern } from '../../lib/answer-formatting/types';
import { patternLibrary } from '../../lib/answer-formatting/pattern-library';

interface OverrideManagerProps {
  questionId: string;
  currentPattern?: string;
  onOverrideAdded?: (override: OverrideRecord) => void;
  onOverrideRemoved?: (questionId: string) => void;
  onClose?: () => void;
}

export const OverrideManager: React.FC<OverrideManagerProps> = ({
  questionId,
  currentPattern,
  onOverrideAdded,
  onOverrideRemoved,
  onClose,
}) => {
  const [justification, setJustification] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingOverride = configurationManager.getOverrideForQuestion(questionId);
  const availablePatterns = patternLibrary.getAllPatterns();

  const handleAddOverride = async () => {
    if (!justification.trim()) {
      setError('Justification is required for manual overrides');
      return;
    }

    if (justification.trim().length < 10) {
      setError('Justification must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const override: Omit<OverrideRecord, 'timestamp'> = {
        questionId,
        justification: justification.trim(),
        originalPattern: currentPattern,
        overridePattern: selectedPattern || undefined,
        userId: 'current-user', // In a real app, this would come from auth context
      };

      configurationManager.addOverride(override);
      
      const savedOverride = configurationManager.getOverrideForQuestion(questionId);
      if (savedOverride) {
        onOverrideAdded?.(savedOverride);
      }

      // Reset form
      setJustification('');
      setSelectedPattern('');
    } catch (err) {
      setError('Failed to add override. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveOverride = () => {
    configurationManager.removeOverride(questionId);
    onOverrideRemoved?.(questionId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPatternName = (patternId: string) => {
    const pattern = availablePatterns.find(p => p.id === patternId);
    return pattern?.name || patternId;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Manual Override Manager
          </CardTitle>
          <CardDescription>
            Override automatic formatting patterns for this question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Question ID:</span>
                <span className="text-sm font-mono">{questionId}</span>
              </div>
              {currentPattern && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Detected Pattern:</span>
                  <Badge variant="outline">{getPatternName(currentPattern)}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Override Status:</span>
                {existingOverride ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active Override
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    No Override
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Existing Override */}
          {existingOverride && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Existing Override</Label>
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(existingOverride.timestamp)}
                  </span>
                </div>
                
                {existingOverride.originalPattern && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Original Pattern:</span>
                    <Badge variant="outline">
                      {getPatternName(existingOverride.originalPattern)}
                    </Badge>
                  </div>
                )}
                
                {existingOverride.overridePattern && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Override Pattern:</span>
                    <Badge variant="secondary">
                      {getPatternName(existingOverride.overridePattern)}
                    </Badge>
                  </div>
                )}
                
                <div className="space-y-1">
                  <span className="text-sm font-medium">Justification:</span>
                  <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                    {existingOverride.justification}
                  </p>
                </div>

                {existingOverride.userId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Created by:</span>
                    <span className="text-sm text-muted-foreground">
                      {existingOverride.userId}
                    </span>
                  </div>
                )}

                <Button 
                  onClick={handleRemoveOverride} 
                  variant="destructive" 
                  size="sm"
                  className="w-full"
                >
                  Remove Override
                </Button>
              </div>
            </div>
          )}

          {/* Add New Override */}
          {!existingOverride && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Add Manual Override</Label>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Manual overrides should only be used when the automatic formatting
                  is inappropriate for this specific question. Please provide a clear
                  justification for the override.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="override-pattern">Override Pattern (Optional)</Label>
                <Select value={selectedPattern} onValueChange={setSelectedPattern}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pattern to override with (or leave blank)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific pattern</SelectItem>
                    {availablePatterns.map((pattern) => (
                      <SelectItem key={pattern.id} value={pattern.id}>
                        {pattern.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave blank to disable formatting for this question
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">
                  Justification <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="justification"
                  placeholder="Explain why this question requires a manual override..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters required. Be specific about why the automatic
                  formatting is not appropriate.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleAddOverride}
                  disabled={isSubmitting || !justification.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Adding Override...' : 'Add Override'}
                </Button>
                {onClose && (
                  <Button onClick={onClose} variant="outline">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Override Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Override Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p className="font-medium">When to use overrides:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Question has unique formatting requirements</li>
              <li>Automatic pattern detection is incorrect</li>
              <li>Content doesn't fit standard patterns</li>
              <li>Special formatting enhances learning</li>
            </ul>
          </div>
          <div className="text-sm space-y-1">
            <p className="font-medium">Best practices:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Provide clear, specific justifications</li>
              <li>Use overrides sparingly</li>
              <li>Review overrides periodically</li>
              <li>Consider updating patterns instead</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverrideManager;