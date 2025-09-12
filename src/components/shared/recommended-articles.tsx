import { recommendArticlesBasedOnUserActivity } from '@/ai/flows/recommend-articles-based-on-user-activity';
import { articles } from '@/lib/data';
import { ArticleCard } from '../articles/article-card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

export const RecommendedArticles = async () => {
  const availableArticlesString = articles.map(a => `- ${a.title} (Categoría: ${a.category})`).join('\n');
  const userActivity = "El usuario ha visto artículos de las categorías 'Moda' y 'Accesorios'. Le interesan las últimas tendencias y los looks minimalistas.";

  let recommendedArticleTitles: string[] = [];
  try {
    const result = await recommendArticlesBasedOnUserActivity({
      recentActivity: userActivity,
      availableArticles: availableArticlesString,
    });
    
    // The AI returns a single string, sometimes numbered, sometimes not.
    // This parsing is robust enough for common formats like "1. Title One\n2. Title Two" or "Title One, Title Two"
    recommendedArticleTitles = result.recommendedArticles
      .split('\n')
      .flatMap(line => line.split(','))
      .map(title => title.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);

  } catch (error) {
    console.error("AI recommendation failed:", error);
    // Render nothing or a fallback on error
    return (
        <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error de Recomendación</AlertTitle>
              <AlertDescription>
                No se pudieron cargar las recomendaciones de IA en este momento.
              </AlertDescription>
            </Alert>
        </div>
    );
  }

  if (recommendedArticleTitles.length === 0) {
    return null;
  }

  const recommended = articles.filter(article => 
    recommendedArticleTitles.some(recommendedTitle => 
      article.title.toLowerCase().includes(recommendedTitle.toLowerCase())
    )
  ).slice(0, 3); // Show up to 3 recommendations

  if(recommended.length === 0){
      return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {recommended.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};
