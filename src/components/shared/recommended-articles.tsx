
import { ArticleCard } from '../articles/article-card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';
import { ArticleDoc } from '@/lib/firestore-types';
import { fetchCachedArticles } from '@/lib/cached-articles';

export const RecommendedArticles = async () => {
  // Fetch a few articles to show as recommendations for now
  const { articles: recommended } = await fetchCachedArticles({ pageSize: 3 });

  if (recommended.length === 0) {
    return (
        <div className="max-w-2xl mx-auto">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Recomendaciones Próximamente</AlertTitle>
              <AlertDescription>
                Las recomendaciones de IA se mostrarán aquí una vez que haya contenido.
              </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {recommended.map(article => (
        <ArticleCard key={article.documentId} article={article} />
      ))}
    </div>
  );
};