/**
 * Configuration Panel Component for Answer Formatting Standards
 * 
 * This component provides a user interface for managing configuration settings,
 * validation rules, and viewing metrics for the answer formatting system.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { 
  configurationManager, 
  ConfigurationSettings, 
  OverrideRecord, 
  ConfigurationMetrics 
} from '../../lib/answer-formatting/configuration-manager';
import { ValidationRule } from '../../lib/answer-formatting/types';

interface ConfigurationPanelProps {
  onSettingsChange?: (settings: ConfigurationSettings) => void;
  onClose?: () => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onSettingsChange,
  onClose,
}) => {
  const [settings, setSettings] = useState<ConfigurationSettings>(
    configurationManager.getSettings()
  );
  const [validationRules, setValidationRules] = useState<ValidationRule[]>(
    configurationManager.getValidationRules()
  );
  const [overrides, setOverrides] = useState<OverrideRecord[]>(
    configurationManager.getOverrides()
  );
  const [metrics, setMetrics] = useState<ConfigurationMetrics>(
    configurationManager.getMetrics()
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Load data on component mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setSettings(configurationManager.getSettings());
    setValidationRules(configurationManager.getValidationRules());
    setOverrides(configurationManager.getOverrides());
    setMetrics(configurationManager.getMetrics());
    setHasChanges(false);
  };

  const handleSettingChange = <K extends keyof ConfigurationSettings>(
    key: K,
    value: ConfigurationSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleValidationRuleToggle = (ruleId: string, enabled: boolean) => {
    const updatedRules = validationRules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled } : rule
    );
    setValidationRules(updatedRules);
    configurationManager.toggleValidationRule(ruleId, enabled);
  };

  const handleSaveSettings = () => {
    configurationManager.updateSettings(settings);
    onSettingsChange?.(settings);
    setHasChanges(false);
  };

  const handleResetSettings = () => {
    configurationManager.resetConfiguration();
    refreshData();
  };

  const handleExportConfig = () => {
    const configData = configurationManager.exportConfiguration();
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'answer-formatting-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
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

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Answer Formatting Configuration</h2>
          <p className="text-muted-foreground">
            Manage settings, validation rules, and view system metrics
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleSaveSettings} variant="default">
              Save Changes
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="rules">Validation Rules</TabsTrigger>
          <TabsTrigger value="overrides">Overrides</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure how the answer formatting system behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-format">Auto-Format Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically apply formatting to answers
                  </p>
                </div>
                <Switch
                  id="auto-format"
                  checked={settings.autoFormatEnabled}
                  onCheckedChange={(checked) => handleSettingChange('autoFormatEnabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="strict-mode">Strict Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enforce stricter validation rules
                  </p>
                </div>
                <Switch
                  id="strict-mode"
                  checked={settings.strictMode}
                  onCheckedChange={(checked) => handleSettingChange('strictMode', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="validation-enabled">Validation Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable answer validation
                  </p>
                </div>
                <Switch
                  id="validation-enabled"
                  checked={settings.validationEnabled}
                  onCheckedChange={(checked) => handleSettingChange('validationEnabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-suggestions">Show Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Display formatting suggestions to users
                  </p>
                </div>
                <Switch
                  id="show-suggestions"
                  checked={settings.showSuggestions}
                  onCheckedChange={(checked) => handleSettingChange('showSuggestions', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-apply-fixes">Auto-Apply Fixes</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically apply suggested fixes
                  </p>
                </div>
                <Switch
                  id="auto-apply-fixes"
                  checked={settings.autoApplyFixes}
                  onCheckedChange={(checked) => handleSettingChange('autoApplyFixes', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="max-validation-score">
                  Minimum Validation Score: {settings.maxValidationScore}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Minimum score required to pass validation (0-100)
                </p>
                <Slider
                  id="max-validation-score"
                  min={0}
                  max={100}
                  step={5}
                  value={[settings.maxValidationScore]}
                  onValueChange={([value]) => handleSettingChange('maxValidationScore', value)}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleResetSettings} variant="outline">
              Reset to Defaults
            </Button>
            <Button onClick={handleExportConfig} variant="outline">
              Export Configuration
            </Button>
          </div>
        </TabsContent>

        {/* Validation Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>
                Enable or disable specific validation rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{rule.id}</Label>
                        <Badge variant={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        {rule.autoFix && (
                          <Badge variant="outline">Auto-fix</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pattern: {rule.pattern}
                      </p>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleValidationRuleToggle(rule.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overrides Tab */}
        <TabsContent value="overrides" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Overrides</CardTitle>
              <CardDescription>
                View and manage manual formatting overrides
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overrides.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No manual overrides have been recorded.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {overrides.map((override, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Question ID: {override.questionId}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(override.timestamp)}
                        </div>
                      </div>
                      {override.originalPattern && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Original Pattern:</span>{' '}
                          {override.originalPattern}
                        </div>
                      )}
                      {override.overridePattern && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Override Pattern:</span>{' '}
                          {override.overridePattern}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Justification:</span>{' '}
                        {override.justification}
                      </div>
                      {override.userId && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">User:</span> {override.userId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalValidations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Auto-Formats Applied</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.autoFormatsApplied}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Manual Overrides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.manualOverrides}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.averageValidationScore.toFixed(1)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{formatDate(metrics.lastUpdated)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Configuration Version:</span>
                <span>{configurationManager.getConfiguration()?.version || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Patterns:</span>
                <span>{configurationManager.getConfiguration()?.patterns.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Rules:</span>
                <span>{validationRules.filter(rule => rule.enabled).length}</span>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={() => configurationManager.resetMetrics()} 
            variant="outline"
          >
            Reset Metrics
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigurationPanel;