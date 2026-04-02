import React from 'react';
import { Card, Badge, Button } from '@/app/components/globalComponents';
import { Clock, ExternalLink, ArrowLeft, X } from 'lucide-react';
import fastAxiosInstance from '@/axiosConfig/axiosfig';
import type { CareerInsight} from '@/types';


export function CareerInsightsPage() {
    const [careerInsights, setCareerInsights] = React.useState<CareerInsight[]>([]);
    const [selectedInsight, setSelectedInsight] = React.useState<CareerInsight | null>(null);

    React.useEffect(() => {
        const fetchCareerInsights = async () => {
            try {
                const response = await fastAxiosInstance.get('/api/career-insights');
                setCareerInsights(response.data);
            } catch (error) {
                console.error('Error fetching career insights:', error);
            }
        }
        fetchCareerInsights();
    }, []);


    const categories = Array.from(new Set(careerInsights.map(i => i.category)));

    const handleInsightClick = (insight: CareerInsight) => {
        if (insight.articleLink) {
            window.open(insight.articleLink.startsWith('http') ? insight.articleLink : `https://${insight.articleLink}`, '_blank');
        } else {
            setSelectedInsight(insight);
        }
    };

    // Detail view for inline content articles
    if (selectedInsight) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <button onClick={() => setSelectedInsight(null)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4" />Back to Career Insights
                </button>

                {selectedInsight.imageUrl && (
                    <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                        <img src={selectedInsight.imageUrl} alt={selectedInsight.title} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="space-y-2">
                    <Badge variant="secondary">{selectedInsight.category}</Badge>
                    <h1 className="text-3xl font-semibold">{selectedInsight.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        {selectedInsight.readTime && (
                            <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{selectedInsight.readTime}</div>
                        )}
                        {selectedInsight.created_at && (
                            <span>{new Date(selectedInsight.created_at).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>

                <div className="prose max-w-none whitespace-pre-wrap text-gray-800">
                    {selectedInsight.content}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
            <h1 className="text-3xl mb-3">Career Insights</h1>
            <p className="text-gray-600">
            Helpful tips and blog posts tailored to your interests
            </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer">All</Badge>
            {categories.map(category => (
            <Badge key={category} variant="outline" className="cursor-pointer">
                {category}
            </Badge>
            ))}
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {careerInsights.map(insight => (
            <Card key={insight.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleInsightClick(insight)}>
                <div className="aspect-video overflow-hidden bg-gray-100">
                <img
                    src={insight.imageUrl}
                    alt={insight.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                </div>
                <div className="p-6 space-y-3">
                <Badge variant="secondary" className="text-xs">
                    {insight.category}
                </Badge>

                <h3 className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {insight.title}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-3">
                    {insight.excerpt}
                </p>

                <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {insight.readTime}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                </div>
            </Card>
            ))}
        </div>
        </div>
    );
}
