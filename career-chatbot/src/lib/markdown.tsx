import React, { useMemo } from 'react';

export function Markdown({ content }: { content: string }) {
  const parsed = useMemo(() => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let orderedItems: React.ReactNode[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1">
            {listItems}
          </ul>
        );
        listItems = [];
      }
    };
    const flushOrdered = () => {
      if (orderedItems.length > 0) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 my-2 space-y-1">
            {orderedItems}
          </ol>
        );
        orderedItems = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (/^### /.test(trimmed)) {
        flushList(); flushOrdered();
        elements.push(<h3 key={idx} className="text-base font-bold mt-3 mb-1 text-foreground">{parseInline(trimmed.slice(4))}</h3>);
      } else if (/^## /.test(trimmed)) {
        flushList(); flushOrdered();
        elements.push(<h2 key={idx} className="text-lg font-bold mt-4 mb-1 text-foreground">{parseInline(trimmed.slice(3))}</h2>);
      } else if (/^# /.test(trimmed)) {
        flushList(); flushOrdered();
        elements.push(<h1 key={idx} className="text-xl font-bold mt-4 mb-2 text-foreground">{parseInline(trimmed.slice(2))}</h1>);
      } else if (/^[-*] /.test(trimmed)) {
        flushOrdered();
        listItems.push(<li key={`li-${idx}`}>{parseInline(trimmed.slice(2))}</li>);
      } else if (/^\d+\. /.test(trimmed)) {
        flushList();
        orderedItems.push(<li key={`li-${idx}`}>{parseInline(trimmed.replace(/^\d+\. /, ''))}</li>);
      } else {
        flushList(); flushOrdered();
        if (trimmed === '') {
          elements.push(<div key={`br-${idx}`} className="h-1.5" />);
        } else {
          elements.push(<p key={`p-${idx}`} className="my-1 leading-relaxed">{parseInline(trimmed)}</p>);
        }
      }
    });

    flushList();
    flushOrdered();
    return elements;
  }, [content]);

  return <div className="markdown-body text-sm">{parsed}</div>;
}

const URL_REGEX = /(https?:\/\/[^\s<>"')\]]+)/g;

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|`[^`]+`)/g);
  const result: React.ReactNode[] = [];

  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      result.push(<strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      result.push(<em key={i}>{part.slice(1, -1)}</em>);
    } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      result.push(<code key={i} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>);
    } else {
      const urlParts = part.split(URL_REGEX);
      urlParts.forEach((urlPart, j) => {
        if (URL_REGEX.test(urlPart)) {
          result.push(
            <a
              key={`${i}-${j}`}
              href={urlPart}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {urlPart}
            </a>
          );
        } else if (urlPart) {
          result.push(<span key={`${i}-${j}`}>{urlPart}</span>);
        }
      });
      URL_REGEX.lastIndex = 0;
    }
  });

  return result;
}
