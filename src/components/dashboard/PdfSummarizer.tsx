'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, UploadCloud, Loader2, FileCheck2, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PdfSummarizer() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');

  const onDrop = React.useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError('');
    if (fileRejections.length > 0) {
      setError('Only .pdf files are accepted.');
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleSummarize = async () => {
    if (!file) {
      setError('Please upload a PDF file first.');
      return;
    }
    setIsLoading(true);
    setSummary('');
    setError('');
    
    // Placeholder for actual summarization logic
    setTimeout(() => {
        setSummary(`This is a ${summaryLength} summary for the document "${file.name}". The actual AI summarization logic would be implemented here, involving sending the file content to a backend or a cloud function that uses a service like Gemini to process the text and return a summary.`);
        setIsLoading(false);
    }, 2000);
  };
  
  const clearFile = () => {
    setFile(null);
    setSummary('');
    setError('');
  }

  return (
    <div className="h-full w-full animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">PDF Document Summarizer</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-8 flex-1">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Your Document</CardTitle>
                    <CardDescription>Upload a PDF file to get a concise summary.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!file ? (
                        <div {...getRootProps()} className={`p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                            <input {...getInputProps()} />
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            {isDragActive ? (
                                <p>Drop the PDF here...</p>
                            ) : (
                                <p>Drag & drop a PDF here, or click to select a file</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">.pdf files only</p>
                        </div>
                    ) : (
                        <div className="p-4 border rounded-lg flex items-center justify-between bg-muted/50">
                            <div className="flex items-center gap-3">
                                <FileCheck2 className="w-6 h-6 text-green-500"/>
                                <div>
                                    <p className="font-semibold truncate max-w-xs">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={clearFile}>
                                <X className="w-4 h-4"/>
                            </Button>
                        </div>
                    )}

                    <Select value={summaryLength} onValueChange={setSummaryLength} disabled={isLoading || !file}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select summary length" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="concise">Concise</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button onClick={handleSummarize} disabled={isLoading || !file} className="w-full">
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Summarizing...</> : 'Generate Summary'}
                    </Button>
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Generated Summary</CardTitle>
                     <CardDescription>The AI-generated summary of your document will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-full mt-4" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    ) : summary ? (
                        <Textarea value={summary} readOnly className="h-full min-h-[300px] bg-muted/50" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-center p-8">
                            <p>Your document summary will be displayed here once generated.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
