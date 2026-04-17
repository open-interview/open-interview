/**
 * Rich Text Renderer v2.0
 * Advanced custom renderer for technical content
 * Handles complex formatting patterns
 */

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

export function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  if (!content) return null;

  // Parse content into structured blocks
  const blocks = parseContent(content);

  return (
    <div className={`rich-text-content space-y-6 ${className}`}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

// Block types
type Block = 
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: number; content: string }
  | { type: 'list'; items: ListItem[]; ordered?: boolean }
  | { type: 'code'; language: string; content: string }
  | { type: 'section'; title: string; items: ListItem[]; subtitle?: string };

type ListItem = {
  text: string;
  bold?: string;
  description?: string;
  number?: number;
};

function parseContent(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }
    
    // Check for section header (bold text with colon)
    const sectionMatch = line.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
    if (sectionMatch) {
      const title = sectionMatch[1].trim();
      const restOfLine = sectionMatch[2].trim();
      const items: ListItem[] = [];
      let subtitle: string | undefined;
      
      // Check if rest of line is a subtitle (not bullets)
      if (restOfLine && !restOfLine.startsWith('*') && !restOfLine.includes(' * ')) {
        subtitle = restOfLine;
      } else if (restOfLine.includes('*')) {
        // Parse inline bullets
        const inlineBullets = restOfLine.split(/\s*\*+\s+/).filter(Boolean);
        for (const bullet of inlineBullets) {
          if (bullet.trim()) {
            items.push(parseListItem(bullet.trim()));
          }
        }
      }
      
      // Check next lines for more bullets
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (!nextLine) {
          i++;
          continue;
        }
        
        // Check for numbered list
        const numberedMatch = nextLine.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          const item = parseListItem(numberedMatch[2]);
          item.number = parseInt(numberedMatch[1]);
          items.push(item);
          i++;
          continue;
        }
        
        // Check for bullet
        if (nextLine.startsWith('*') || nextLine.startsWith('•') || nextLine.startsWith('-')) {
          const bulletText = nextLine.replace(/^[*•\-]\s*/, '');
          
          // Check if line has multiple bullets
          if (bulletText.includes(' * ') || bulletText.includes(' • ')) {
            const subBullets = bulletText.split(/\s*[*•]\s+/).filter(Boolean);
            for (const sub of subBullets) {
              if (sub.trim()) {
                items.push(parseListItem(sub.trim()));
              }
            }
          } else {
            items.push(parseListItem(bulletText));
          }
          i++;
          continue;
        }
        
        // Not a bullet, break
        break;
      }
      
      blocks.push({ type: 'section', title, items, subtitle });
      continue;
    }
    
    // Check for numbered list
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const items: ListItem[] = [];
      
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (!currentLine) {
          i++;
          continue;
        }
        
        const numMatch = currentLine.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          const item = parseListItem(numMatch[2]);
          item.number = parseInt(numMatch[1]);
          items.push(item);
          i++;
        } else {
          break;
        }
      }
      
      blocks.push({ type: 'list', items, ordered: true });
      continue;
    }
    
    // Check for bullet point
    if (line.startsWith('*') || line.startsWith('•') || line.startsWith('-')) {
      const items: ListItem[] = [];
      
      // Collect all consecutive bullets
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (!currentLine) {
          i++;
          continue;
        }
        
        if (currentLine.startsWith('*') || currentLine.startsWith('•') || currentLine.startsWith('-')) {
          const bulletText = currentLine.replace(/^[*•\-]\s*/, '');
          
          // Check if line has multiple bullets
          if (bulletText.includes(' * ') || bulletText.includes(' • ')) {
            const subBullets = bulletText.split(/\s*[*•]\s+/).filter(Boolean);
            for (const sub of subBullets) {
              if (sub.trim()) {
                items.push(parseListItem(sub.trim()));
              }
            }
          } else {
            items.push(parseListItem(bulletText));
          }
          i++;
        } else {
          break;
        }
      }
      
      blocks.push({ type: 'list', items });
      continue;
    }
    
    // Check for code block
    if (line.startsWith('```')) {
      const language = line.substring(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      blocks.push({ type: 'code', language, content: codeLines.join('\n') });
      i++;
      continue;
    }
    
    // Check for heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ 
        type: 'heading', 
        level: headingMatch[1].length, 
        content: headingMatch[2] 
      });
      i++;
      continue;
    }
    
    // Regular paragraph
    const paragraphLines: string[] = [line];
    i++;
    
    // Collect consecutive non-special lines
    while (i < lines.length) {
      const nextLine = lines[i].trim();
      if (!nextLine || 
          nextLine.startsWith('*') || 
          nextLine.startsWith('•') || 
          nextLine.startsWith('-') ||
          nextLine.startsWith('#') ||
          nextLine.startsWith('```') ||
          nextLine.match(/^\*\*[^*]+\*\*:/) ||
          nextLine.match(/^\d+\./)) {
        break;
      }
      paragraphLines.push(nextLine);
      i++;
    }
    
    blocks.push({ type: 'paragraph', content: paragraphLines.join(' ') });
  }
  
  return blocks;
}

function parseListItem(text: string): ListItem {
  // Remove any leading asterisks or bullets that might have been missed
  text = text.replace(/^\*+\s*/, '').trim();
  
  // Check for bold text followed by colon and description
  const boldColonMatch = text.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
  if (boldColonMatch) {
    return {
      text: text,
      bold: boldColonMatch[1].trim(),
      description: boldColonMatch[2].trim()
    };
  }
  
  // Check for bold text followed by description (no colon)
  const boldSpaceMatch = text.match(/^\*\*([^*]+)\*\*\s+(.+)$/);
  if (boldSpaceMatch) {
    return {
      text: text,
      bold: boldSpaceMatch[1].trim(),
      description: boldSpaceMatch[2].trim()
    };
  }
  
  // Check for bold text only
  const boldOnlyMatch = text.match(/^\*\*([^*]+)\*\*$/);
  if (boldOnlyMatch) {
    return {
      text: text,
      bold: boldOnlyMatch[1].trim()
    };
  }
  
  return { text };
}

function renderBlock(block: Block, index: number): React.ReactNode {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={index} className="text-[#d0d0d0] leading-[1.8] text-[15px]">
          {renderInlineFormatting(block.content)}
        </p>
      );
      
    case 'heading':
      const headingClasses = "font-bold text-white leading-tight";
      const headingContent = renderInlineFormatting(block.content);
      
      switch (block.level) {
        case 1:
          return <h1 key={index} className={`${headingClasses} text-3xl mt-8 mb-4`}>{headingContent}</h1>;
        case 2:
          return <h2 key={index} className={`${headingClasses} text-2xl mt-6 mb-3`}>{headingContent}</h2>;
        case 3:
          return <h3 key={index} className={`${headingClasses} text-xl mt-5 mb-3`}>{headingContent}</h3>;
        case 4:
          return <h4 key={index} className={`${headingClasses} text-lg mt-4 mb-2`}>{headingContent}</h4>;
        case 5:
          return <h5 key={index} className={`${headingClasses} text-base mt-3 mb-2`}>{headingContent}</h5>;
        case 6:
          return <h6 key={index} className={`${headingClasses} text-sm mt-3 mb-2`}>{headingContent}</h6>;
        default:
          return <h3 key={index} className={`${headingClasses} text-xl mt-5 mb-3`}>{headingContent}</h3>;
      }
      
    case 'list':
      if (block.ordered) {
        return (
          <ol key={index} className="space-y-3 my-5 pl-6 list-decimal marker:text-[#00d4ff] marker:font-bold">
            {block.items.map((item, i) => (
              <li key={i} className="leading-[1.8] text-[#d0d0d0] pl-2">
                {renderListItemContent(item)}
              </li>
            ))}
          </ol>
        );
      }
      
      return (
        <ul key={index} className="space-y-3 my-5 pl-6 list-disc marker:text-[#00d4ff]">
          {block.items.map((item, i) => (
            <li key={i} className="leading-[1.8] text-[#d0d0d0] pl-2">
              {renderListItemContent(item)}
            </li>
          ))}
        </ul>
      );
      
    case 'section':
      return (
        <div key={index} className="my-8 p-6 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-[20px]">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-[#00ff88] text-2xl mt-0.5 flex-shrink-0">▸</span>
            <div className="flex-1">
              <h4 className="font-bold text-xl text-white leading-tight">
                {block.title}
              </h4>
              {block.subtitle && (
                <p className="text-[#a0a0a0] text-sm mt-2 leading-relaxed">
                  {renderInlineFormatting(block.subtitle)}
                </p>
              )}
            </div>
          </div>
          {block.items.length > 0 && (
            <ul className="space-y-3 pl-8">
              {block.items.map((item, i) => (
                <li key={i} className="leading-[1.8] text-[#d0d0d0] list-disc marker:text-[#00d4ff] pl-2">
                  {renderListItemContent(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
      
    case 'code':
      return (
        <div key={index} className="my-6 rounded-[16px] overflow-hidden border border-white/10">
          <SyntaxHighlighter
            language={block.language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.4)',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
            showLineNumbers={block.content.split('\n').length > 5}
          >
            {block.content}
          </SyntaxHighlighter>
        </div>
      );
      
    default:
      return null;
  }
}

function renderListItemContent(item: ListItem): React.ReactNode {
  if (item.bold) {
    return (
      <>
        <span className="font-bold text-[#00ff88]">{item.bold}</span>
        {item.description && (
          <>
            <span className="text-[#00d4ff] mx-1">:</span>
            <span className="text-[#d0d0d0]">{renderInlineFormatting(item.description)}</span>
          </>
        )}
      </>
    );
  }
  
  return renderInlineFormatting(item.text);
}

function renderInlineFormatting(text: string): React.ReactNode {
  if (!text) return null;
  
  // Split by bold markers and code markers
  const segments: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining) {
    // Check for bold text
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)/);
    if (boldMatch) {
      // Add text before bold
      if (boldMatch[1]) {
        segments.push(processCodeInText(boldMatch[1], key++));
      }
      // Add bold text
      segments.push(
        <strong key={key++} className="font-bold text-white">
          {processCodeInText(boldMatch[2], key++)}
        </strong>
      );
      remaining = boldMatch[3];
      continue;
    }
    
    // No more bold markers, process remaining text
    segments.push(processCodeInText(remaining, key++));
    break;
  }
  
  return segments;
}

function processCodeInText(text: string, baseKey: number): React.ReactNode {
  if (!text) return null;
  
  // Split by code markers
  const parts = text.split(/(`[^`]+`)/g);
  
  return parts.map((part, i) => {
    const codeMatch = part.match(/^`([^`]+)`$/);
    if (codeMatch) {
      return (
        <code 
          key={`${baseKey}-${i}`} 
          className="bg-black/40 border border-[#00d4ff]/20 px-2 py-0.5 rounded-md text-[#00d4ff] text-[13px] font-mono mx-0.5"
        >
          {codeMatch[1]}
        </code>
      );
    }
    return part || null;
  });
}
