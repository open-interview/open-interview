/**
 * Interview Intelligence Dashboard
 * 
 * Displays:
 * - Cognitive profile (how you think)
 * - Company readiness scores
 * - Knowledge DNA export
 * - Mock interview launcher
 */

import { useState } from 'react';
import { useInterviewIntelligence } from '../hooks/use-interview-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Brain, Building2, Dna, Target, Download, ChevronRight,
  Sparkles, TrendingUp, AlertCircle
} from 'lucide-react';

export function InterviewIntelligence() {
  const {
    loading,
    cognitiveProfile,
    companyReadiness,
    knowledgeDNA,
    getMockInterview,
    exportKnowledgeDNA,
    hasEnoughData
  } = useInterviewIntelligence();
  
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading intelligence...</div>
      </div>
    );
  }
  
  if (!hasEnoughData) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-1">Not Enough Data Yet</h3>
          <p className="text-sm text-muted-foreground">
            Answer at least 5 questions to unlock your Interview Intelligence profile.
          </p>
        </CardContent>
      </Card>
    );
  }


  // Find primary cognitive pattern
  const primaryPattern = Object.entries(cognitiveProfile)
    .sort((a, b) => b[1].score - a[1].score)[0];
  
  const mockInterview = selectedCompany ? getMockInterview(selectedCompany) : null;

  return (
    <div className="space-y-4">
      {/* Cognitive Profile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            Your Cognitive Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {primaryPattern && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm">{primaryPattern[1].name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{primaryPattern[1].description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(cognitiveProfile).map(([id, pattern]) => (
              <div key={id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate">{pattern.name.split(' ')[0]}</span>
                  <span className="text-muted-foreground">{pattern.score}%</span>
                </div>
                <Progress value={pattern.score} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Company Readiness */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            Company Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {companyReadiness.slice(0, 6).map((company) => (
            <button
              key={company.companyId}
              onClick={() => setSelectedCompany(
                selectedCompany === company.companyId ? null : company.companyId
              )}
              className="w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{company.companyName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {company.readinessScore}%
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${
                    selectedCompany === company.companyId ? 'rotate-90' : ''
                  }`} />
                </div>
              </div>
              <Progress value={company.readinessScore} className="h-1.5" />
              
              {selectedCompany === company.companyId && (
                <div className="mt-2 pt-2 border-t space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {company.strengths.slice(0, 3).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />{s}
                      </Badge>
                    ))}
                  </div>
                  {company.gaps.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Focus on: {company.recommendedFocus.join(', ')}
                    </div>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {company.interviewStyle}
                  </Badge>
                </div>
              )}
            </button>
          ))}
        </CardContent>
      </Card>


      {/* Mock Interview */}
      {mockInterview && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              Mock Interview: {mockInterview.companyName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground mb-2">
              {mockInterview.rounds.length} rounds • {mockInterview.estimatedDuration}
            </div>
            {mockInterview.rounds.map((round, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                <span>{round.name}</span>
                <span className="text-xs text-muted-foreground">
                  {round.questionIds.length} questions • {round.duration}
                </span>
              </div>
            ))}
            {mockInterview.tips.length > 0 && (
              <div className="mt-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-xs font-medium mb-1">Tips:</div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {mockInterview.tips.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Knowledge DNA Export */}
      {knowledgeDNA && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dna className="w-4 h-4 text-cyan-500" />
              Knowledge DNA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mb-3">
              Your portable technical expertise profile. Share with recruiters or track your growth.
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Questions</div>
                <div className="font-medium">{knowledgeDNA.totalQuestionsAnswered}</div>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Topics</div>
                <div className="font-medium">{knowledgeDNA.uniqueTopics}</div>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={exportKnowledgeDNA}
            >
              <Download className="w-3 h-3 mr-2" />
              Export Knowledge DNA
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default InterviewIntelligence;
