import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const DIAGRAM_PAGES = [
  { channel: 'algorithms', id: 'q-16679', diagramType: 'flowchart' },
  { channel: 'android', id: 'q-19648', diagramType: 'flowchart' },
  { channel: 'api-testing', id: 'q-29128', diagramType: 'flowchart' },
  { channel: 'aws-ai-practitioner', id: 'q-15868', diagramType: 'flowchart' },
  { channel: 'aws-data-engineer', id: 'q-29149', diagramType: 'flowchart' },
  { channel: 'aws-database-specialty', id: 'q-3289', diagramType: 'flowchart' },
  { channel: 'aws-devops-pro', id: 'q-17079', diagramType: 'flowchart' },
  { channel: 'aws-dva', id: 'q-18881', diagramType: 'flowchart' },
  { channel: 'aws-ml-specialty', id: 'q-1887', diagramType: 'flowchart' },
  { channel: 'aws-networking-specialty', id: 'q-15248', diagramType: 'flowchart' },
  { channel: 'aws-saa', id: 'q-7298', diagramType: 'flowchart' },
  { channel: 'aws-sap', id: 'q-12410', diagramType: 'flowchart' },
  { channel: 'aws-security-specialty', id: 'q-12005', diagramType: 'flowchart' },
  { channel: 'aws-sysops', id: 'q-15784', diagramType: 'flowchart' },
  { channel: 'aws', id: 'q-27445', diagramType: 'flowchart' },
  { channel: 'azure-administrator', id: 'q-23737', diagramType: 'flowchart' },
  { channel: 'azure-ai-engineer', id: 'q-26360', diagramType: 'flowchart' },
  { channel: 'azure-data-engineer', id: 'q-29121', diagramType: 'flowchart' },
  { channel: 'azure-developer', id: 'q-14039', diagramType: 'flowchart' },
  { channel: 'azure-devops-engineer', id: 'q-15428', diagramType: 'flowchart' },
  { channel: 'azure-solutions-architect', id: 'q-13054', diagramType: 'flowchart' },
  { channel: 'azure-sql-dba', id: 'q-23810', diagramType: 'flowchart' },
  { channel: 'azure', id: 'q-14265', diagramType: 'flowchart' },
  { channel: 'bash', id: 'q-9031', diagramType: 'flowchart' },
  { channel: 'cicd', id: 'q-14886', diagramType: 'flowchart' },
  { channel: 'cissp', id: 'q-23420', diagramType: 'flowchart' },
  { channel: 'cloud', id: 'q-27553', diagramType: 'flowchart' },
  { channel: 'computer-vision', id: 'q-29840', diagramType: 'flowchart' },
  { channel: 'computer-architecture', id: 'q-22197', diagramType: 'flowchart' },
  { channel: 'cpp', id: 'q-17599', diagramType: 'flowchart' },
  { channel: 'crypto', id: 'q-15352', diagramType: 'flowchart' },
  { channel: 'css', id: 'q-21518', diagramType: 'flowchart' },
  { channel: 'cybersecurity', id: 'q-18740', diagramType: 'flowchart' },
  { channel: 'data-analytics', id: 'q-12536', diagramType: 'flowchart' },
  { channel: 'data-engineering', id: 'q-22948', diagramType: 'flowchart' },
  { channel: 'data-science', id: 'q-23082', diagramType: 'flowchart' },
  { channel: 'data-structures', id: 'q-21536', diagramType: 'flowchart' },
  { channel: 'database', id: 'q-25643', diagramType: 'flowchart' },
  { channel: 'devops', id: 'q-23962', diagramType: 'flowchart' },
  { channel: 'django', id: 'q-27744', diagramType: 'flowchart' },
  { channel: 'docker', id: 'q-23732', diagramType: 'flowchart' },
  { channel: 'dotnet', id: 'q-14884', diagramType: 'flowchart' },
  { channel: 'elasticsearch', id: 'q-12541', diagramType: 'flowchart' },
  { channel: 'electronics', id: 'q-18235', diagramType: 'flowchart' },
  { channel: 'embedded', id: 'q-24911', diagramType: 'flowchart' },
  { channel: 'flask', id: 'q-25504', diagramType: 'flowchart' },
  { channel: 'general', id: 'q-20906', diagramType: 'flowchart' },
  { channel: 'git', id: 'q-15749', diagramType: 'flowchart' },
  { channel: 'go', id: 'q-17464', diagramType: 'flowchart' },
  { channel: 'gcp', id: 'q-23963', diagramType: 'flowchart' },
  { channel: 'gcp-devops', id: 'q-30044', diagramType: 'flowchart' },
  { channel: 'gcp-network', id: 'q-29958', diagramType: 'flowchart' },
  { channel: 'gcp-security', id: 'q-28291', diagramType: 'flowchart' },
  { channel: 'golang', id: 'q-30511', diagramType: 'flowchart' },
  { channel: 'gradle', id: 'q-21534', diagramType: 'flowchart' },
  { channel: 'graphql', id: 'q-11523', diagramType: 'flowchart' },
  { channel: 'html', id: 'q-27125', diagramType: 'sequenceDiagram' },
  { channel: 'istio', id: 'q-29254', diagramType: 'flowchart' },
  { channel: 'java', id: 'q-27842', diagramType: 'flowchart' },
  { channel: 'javascript', id: 'q-10298', diagramType: 'flowchart' },
  { channel: 'jenkins', id: 'q-12105', diagramType: 'flowchart' },
  { channel: 'kafka', id: 'q-11628', diagramType: 'flowchart' },
  { channel: 'k8s', id: 'q-16924', diagramType: 'flowchart' },
  { channel: 'kotlin', id: 'q-29638', diagramType: 'flowchart' },
  { channel: 'kubernetes', id: 'q-18084', diagramType: 'flowchart' },
  { channel: 'leadership', id: 'q-23658', diagramType: 'flowchart' },
  { channel: 'linux', id: 'q-28519', diagramType: 'flowchart' },
  { channel: 'llm', id: 'q-27634', diagramType: 'flowchart' },
  { channel: 'machine-learning', id: 'q-28756', diagramType: 'flowchart' },
  { channel: 'math', id: 'q-22302', diagramType: 'flowchart' },
  { channel: 'maven', id: 'q-20045', diagramType: 'flowchart' },
  { channel: 'microservices', id: 'q-28313', diagramType: 'flowchart' },
  { channel: 'mlops', id: 'q-23167', diagramType: 'flowchart' },
  { channel: 'mongodb', id: 'q-15847', diagramType: 'flowchart' },
  { channel: 'mysql', id: 'q-22134', diagramType: 'flowchart' },
  { channel: 'networking', id: 'q-28983', diagramType: 'flowchart' },
  { channel: 'neuroscience', id: 'q-14848', diagramType: 'flowchart' },
  { channel: 'nlp', id: 'q-12091', diagramType: 'flowchart' },
  { channel: 'nodejs', id: 'q-14603', diagramType: 'flowchart' },
  { channel: 'nosql', id: 'q-28777', diagramType: 'flowchart' },
  { channel: 'object-oriented-design', id: 'q-13021', diagramType: 'flowchart' },
  { channel: 'observability', id: 'q-15280', diagramType: 'flowchart' },
  { channel: 'openstack', id: 'q-29681', diagramType: 'flowchart' },
  { channel: 'operating-system', id: 'q-28268', diagramType: 'flowchart' },
  { channel: 'pandas', id: 'q-29905', diagramType: 'flowchart' },
  { channel: 'php', id: 'q-29313', diagramType: 'flowchart' },
  { channel: 'postgresql', id: 'q-14814', diagramType: 'flowchart' },
  { channel: 'python', id: 'q-25922', diagramType: 'flowchart' },
  { channel: 'pytorch', id: 'q-17335', diagramType: 'flowchart' },
  { channel: 'r', id: 'q-21473', diagramType: 'flowchart' },
  { channel: 'react', id: 'q-18615', diagramType: 'flowchart' },
  { channel: 'react-native', id: 'q-30080', diagramType: 'flowchart' },
  { channel: 'redis', id: 'q-29334', diagramType: 'flowchart' },
  { channel: 'rest-api', id: 'q-16830', diagramType: 'flowchart' },
  { channel: 'rust', id: 'q-25367', diagramType: 'flowchart' },
  { channel: 'scala', id: 'q-21612', diagramType: 'flowchart' },
  { channel: 'security', id: 'q-18381', diagramType: 'flowchart' },
  { channel: 'selenium', id: 'q-29275', diagramType: 'flowchart' },
  { channel: 'solidity', id: 'q-29524', diagramType: 'flowchart' },
  { channel: 'sql', id: 'q-17345', diagramType: 'flowchart' },
  { channel: 'swift', id: 'q-28452', diagramType: 'flowchart' },
  { channel: 'system-design', id: 'q-12069', diagramType: 'flowchart' },
  { channel: 'tailwindcss', id: 'q-18144', diagramType: 'flowchart' },
  { channel: 'tensorflow', id: 'q-27826', diagramType: 'flowchart' },
  { channel: 'terraform', id: 'q-25984', diagramType: 'flowchart' },
  { channel: 'typescript', id: 'q-18215', diagramType: 'flowchart' },
  { channel: 'unity', id: 'q-13333', diagramType: 'flowchart' },
  { channel: 'vue', id: 'q-28235', diagramType: 'flowchart' },
  { channel: 'web-components', id: 'q-19421', diagramType: 'flowchart' },
  { channel: 'web3', id: 'q-16875', diagramType: 'flowchart' },
];

const SCREENSHOT_DIR = path.join(process.cwd(), 'e2e', 'reports', 'diagram-screenshots');

test.describe('Diagram Rendering Validation', () => {
  test.beforeAll(() => {
    const dir = path.join(process.cwd(), 'e2e', 'reports', 'diagram-screenshots');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  for (const page of DIAGRAM_PAGES) {
    test(`diagram renders for ${page.channel}/${page.id} (${page.diagramType})`, async ({ page: p }, testInfo) => {
      testInfo.setTimeout(60000);

      const url = `/channel/${page.channel}/${page.id}`;
      await p.goto(url, { waitUntil: 'networkidle' });

      // Wait for the page to fully load
      await p.waitForLoadState('domcontentloaded');

      // Wait a bit for React to hydrate and mermaid to load
      await p.waitForTimeout(3000);

      // Check for errors in console
      const consoleErrors: string[] = [];
      p.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Wait for either the mermaid container (success) or loading state
      const mermaidContainer = p.locator('.mermaid-container');
      const loadingText = p.locator('text=Loading diagram');

      try {
        // Wait for the SVG to appear inside the mermaid container
        await p.waitForSelector('.mermaid-container svg', { timeout: 15000 });
      } catch {
        // If SVG not found, check if mermaid-container exists at all
        const containerExists = await mermaidContainer.count();
        const loadingVisible = await loadingText.count();

        if (containerExists === 0 && loadingVisible === 0) {
          // Diagram might have errored (component returns null on error)
          // Check if the page has any answer content
          const pageContent = await p.textContent('body') || '';
          const hasErrorContent = pageContent.includes('Error:') || pageContent.includes('undefined');

          await p.screenshot({
            path: path.join(SCREENSHOT_DIR, `${page.channel}_${page.id}_FAIL.png`),
            fullPage: true,
          });

          // Collect any console errors for debugging
          const errors = consoleErrors.filter(e =>
            e.includes('mermaid') || e.includes('diagram') || e.includes('render') || e.includes('Module')
          ).join('; ');

          test.fail(true, `Diagram not rendered for ${page.channel}/${page.id}. Container: ${containerExists}, Loading: ${loadingVisible}, Errors: ${errors || 'none'}`);
          return;
        } else if (loadingVisible > 0) {
          // Still loading - give more time
          try {
            await p.waitForSelector('.mermaid-container svg', { timeout: 20000 });
          } catch {
            await p.screenshot({
              path: path.join(SCREENSHOT_DIR, `${page.channel}_${page.id}_TIMEOUT.png`),
              fullPage: true,
            });
            test.fail(true, `Diagram still loading after timeout for ${page.channel}/${page.id}`);
            return;
          }
        }
      }

      // Verify the SVG is actually rendered with content
      const svg = mermaidContainer.locator('svg');
      const svgCount = await svg.count();
      expect(svgCount).toBeGreaterThan(0);

      // Check SVG has visible elements (not empty)
      const svgChildren = await svg.first().locator('> *').count();
      expect(svgChildren).toBeGreaterThan(0);

      // Check there are no error indicators
      const errorText = p.locator('.text-red-500, .error-message');
      const errorCount = await errorText.count();
      expect(errorCount).toBe(0);

      // Take screenshot of the rendered diagram
      const screenshotName = `${page.channel}_${page.id}_${page.diagramType}.png`;
      await mermaidContainer.first().screenshot({
        path: path.join(SCREENSHOT_DIR, screenshotName),
      });

      // Verify screenshot file exists and has content
      const stat = fs.statSync(path.join(SCREENSHOT_DIR, screenshotName));
      expect(stat.size).toBeGreaterThan(1000); // Should be at least 1KB for a real diagram
    });
  }
});
