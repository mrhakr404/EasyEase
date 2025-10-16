'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { NotebookText, PlusCircle, Trash2, FilePenLine } from 'lucide-react';
import type { Note } from '@/lib/types';
import { createNote, updateNote, deleteNote } from '@/lib/firebase/notes';
import { formatDistanceToNow } from 'date-fns';

export function NotesTab() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const notesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, `userProfiles/${user.uid}/notes`), 
        orderBy('updatedAt', 'desc')
    );
  }, [user, firestore]);
  
  const { data: notes, isLoading } = useCollection<Note>(notesQuery as any);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(true);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    if (!user || !firestore) return;
    if (!title || !content) {
        // Maybe show a toast message
        return;
    }

    if (selectedNote) {
        // Update existing note
        updateNote(firestore, user.uid, selectedNote.id, { title, content });
    } else {
        // Create new note
        createNote(firestore, user.uid, { title, content });
    }
    
    // Optimistically update UI, though maybe not needed with real-time listener
    setIsEditing(false);
  };

  const handleDeleteNote = (noteId: string) => {
    if (!user || !firestore) return;
    deleteNote(firestore, user.uid, noteId);
    if(selectedNote?.id === noteId) {
        setIsEditing(false);
        setSelectedNote(null);
        setTitle('');
        setContent('');
    }
  };

  return (
    <div className="flex h-full gap-8">
      {/* Notes List */}
      <Card className="w-1/3 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><NotebookText /> My Notes</CardTitle>
            <Button size="icon" variant="ghost" onClick={handleNewNote}><PlusCircle /></Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
          )}
          {!isLoading && notes?.length === 0 && (
            <div className="text-center text-muted-foreground pt-10">
                <p>No notes yet.</p>
                <p>Click the '+' to create one.</p>
            </div>
          )}
          <div className="space-y-2">
            {notes?.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`p-3 rounded-lg cursor-pointer border ${selectedNote?.id === note.id ? 'bg-accent/50 border-accent' : 'hover:bg-muted/50'}`}
              >
                <h3 className="font-semibold truncate">{note.title}</h3>
                <p className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(note.updatedAt.toDate(), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor View */}
      <Card className="w-2/3 flex flex-col">
        {isEditing ? (
            <>
                <CardHeader>
                    <Input 
                        placeholder="Note Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-bold border-0 shadow-none focus-visible:ring-0 px-0"
                    />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                    <Textarea 
                        placeholder="Start writing your note..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0 px-0"
                    />
                    <div className="flex items-center justify-end gap-2">
                        {selectedNote && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon"><Trash2 /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete your note. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteNote(selectedNote.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSaveNote}>Save Note</Button>
                    </div>
                </CardContent>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                <FilePenLine className="w-16 h-16" />
                <p className="text-lg">Select a note to view or edit</p>
                <p>Or create a new one!</p>
                <Button onClick={handleNewNote}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Note
                </Button>
            </div>
        )}
      </Card>
    </div>
  );
}
