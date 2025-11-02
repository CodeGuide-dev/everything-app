'use client';

import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Search, FileText, ExternalLink, Trash2 } from 'lucide-react';

interface SearchResult {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  chunkText: string;
  similarityScore: number;
}

interface Document {
  id: string;
  filename: string;
  contentType: string;
  status: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

interface DocumentSearchProps {
  userId: string;
}

export function DocumentSearch({ userId }: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const searchDocuments = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [query, userId]);

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/search?endpoint=documents', {
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
      } else {
        console.error('Failed to load documents:', data.error);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }, [userId]);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/search?endpoint=stats', {
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Failed to load stats:', data.error);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [userId]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        loadStats(); // Refresh stats
      } else {
        setError(data.error || 'Failed to delete document');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete document');
    }
  }, [userId, loadStats]);

  const viewDocument = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (data.success) {
        // You could open a modal or navigate to a document detail page
        console.log('Document details:', data.document);
        alert(`Document: ${data.document.filename}\nChunks: ${data.document.chunks.length}\nStatus: ${data.document.status}`);
      } else {
        setError(data.error || 'Failed to load document');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load document');
    }
  }, [userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-50';
    if (score >= 0.8) return 'text-blue-600 bg-blue-50';
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Load initial data
  useState(() => {
    loadDocuments();
    loadStats();
  });

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Documents</CardTitle>
          <CardDescription>
            Search through your uploaded documents using semantic similarity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
              className="flex-1"
            />
            <Button onClick={searchDocuments} disabled={isSearching || !query.trim()}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Search Results ({searchResults.length})</h4>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{result.documentName}</span>
                            <Badge variant="outline">Chunk {result.chunkIndex + 1}</Badge>
                          </div>
                          <Badge className={getSimilarityColor(result.similarityScore)}>
                            {(result.similarityScore * 100).toFixed(1)}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {result.chunkText}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDocument(result.documentId)}
                          className="w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            Manage and view your processed documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completedDocuments}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.processingDocuments}</div>
                <div className="text-sm text-gray-500">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalChunks}</div>
                <div className="text-sm text-gray-500">Chunks</div>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(doc.size)} • {doc.contentType} • {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={doc.status === 'completed' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewDocument(doc.id)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>No documents yet. Upload some files to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}