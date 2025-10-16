'use client';

import React, { memo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Check, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock = memo(({ language, value }: CodeBlockProps) => {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = React.useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    toast({ description: "Copied to clipboard" });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="relative font-code text-sm bg-[#1e1e1e] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-700 text-gray-300">
        <span className="text-xs">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCopy}
        >
          {hasCopied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
        codeTagProps={{
          style: {
            fontFamily: 'inherit',
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
export { CodeBlock };
