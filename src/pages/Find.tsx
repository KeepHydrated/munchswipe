import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronRight, RotateCcw, MapPin, Star, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useRestaurants } from '@/contexts/RestaurantContext';

interface QuizAnswer {
  mood: string;
  vibe: string;
  hunger: string;
  adventure: string;
  company: string;
}

interface Recommendation {
  restaurantName?: string;
  restaurantIndex?: number;
  cuisine?: string;
  matchReason: string;
  emoji: string;
}

const QUIZ_QUESTIONS = [
  {
    id: 'mood',
    question: "What's your mood right now?",
    options: [
      { value: 'happy', label: '😊 Happy & Celebratory' },
      { value: 'comfort', label: '🥰 Need Comfort Food' },
      { value: 'stressed', label: '😤 Stressed & Need a Treat' },
      { value: 'adventurous', label: '🤩 Feeling Adventurous' },
    ],
  },
  {
    id: 'vibe',
    question: 'What vibe are you looking for?',
    options: [
      { value: 'casual', label: '👕 Casual & Relaxed' },
      { value: 'fancy', label: '✨ Fancy Night Out' },
      { value: 'quick', label: '⚡ Quick & Easy' },
      { value: 'cozy', label: '🏠 Cozy & Intimate' },
    ],
  },
  {
    id: 'hunger',
    question: 'How hungry are you?',
    options: [
      { value: 'starving', label: '🍖 Absolutely Starving' },
      { value: 'moderate', label: '🍽️ Normal Hungry' },
      { value: 'light', label: '🥗 Just a Light Bite' },
      { value: 'snacky', label: '🍿 Snacky Mood' },
    ],
  },
  {
    id: 'adventure',
    question: 'How adventurous are you feeling?',
    options: [
      { value: 'safe', label: '🏠 Stick to What I Know' },
      { value: 'slightly', label: '🚶 Slightly Adventurous' },
      { value: 'very', label: '🚀 Try Something New' },
      { value: 'wild', label: '🎢 Surprise Me!' },
    ],
  },
  {
    id: 'company',
    question: "Who are you dining with?",
    options: [
      { value: 'solo', label: '🧘 Just Me' },
      { value: 'date', label: '💕 Date Night' },
      { value: 'friends', label: '👯 Friends' },
      { value: 'family', label: '👨‍👩‍👧‍👦 Family' },
    ],
  },
];

const Find = () => {
  const { restaurants } = useRestaurants();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswer>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [matchedRestaurant, setMatchedRestaurant] = useState<typeof restaurants[0] | null>(null);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Send restaurants data to get a specific recommendation
      const restaurantData = restaurants.map(r => ({
        name: r.name,
        cuisine: r.cuisine,
        rating: r.rating,
        distance: r.distance,
        description: r.description,
      }));

      const { data, error } = await supabase.functions.invoke('restaurant-quiz', {
        body: { answers, restaurants: restaurantData },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRecommendation(data.recommendation);
      
      // Find the matched restaurant from the list
      if (data.recommendation.restaurantIndex !== undefined) {
        setMatchedRestaurant(restaurants[data.recommendation.restaurantIndex]);
      } else if (data.recommendation.restaurantName) {
        const found = restaurants.find(r => 
          r.name.toLowerCase() === data.recommendation.restaurantName.toLowerCase()
        );
        setMatchedRestaurant(found || null);
      }
    } catch (error) {
      console.error('Quiz error:', error);
      toast({
        title: 'Oops!',
        description: 'Could not get recommendations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setRecommendation(null);
    setMatchedRestaurant(null);
  };

  const openDirections = (restaurant: typeof restaurants[0]) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`;
    window.open(url, '_blank');
  };

  const isComplete = Object.keys(answers).length === QUIZ_QUESTIONS.length;
  const currentQ = QUIZ_QUESTIONS[currentQuestion];

  // Show results
  if (recommendation) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="shadow-warm overflow-hidden">
            <CardHeader className="text-center bg-gradient-primary text-primary-foreground pb-8">
              <div className="text-6xl mb-4">{recommendation.emoji}</div>
              <CardTitle className="text-2xl">Your Perfect Match!</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {matchedRestaurant ? (
                <>
                  {/* Restaurant Card */}
                  <div className="rounded-xl overflow-hidden border border-border">
                    {matchedRestaurant.photoUrl && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={matchedRestaurant.photoUrl} 
                          alt={matchedRestaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-xl">{matchedRestaurant.name}</h3>
                          {matchedRestaurant.cuisine && (
                            <Badge variant="secondary" className="mt-1">
                              {matchedRestaurant.cuisine}
                            </Badge>
                          )}
                        </div>
                        {matchedRestaurant.rating && (
                          <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-primary fill-primary" />
                            <span className="font-semibold">{matchedRestaurant.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{matchedRestaurant.address}</span>
                        <span className="text-primary font-medium">
                          ({matchedRestaurant.distance} mi)
                        </span>
                      </div>

                      {matchedRestaurant.description && (
                        <p className="text-sm text-muted-foreground italic">
                          {matchedRestaurant.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Match Reason */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-center text-muted-foreground">
                      {recommendation.matchReason}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => openDirections(matchedRestaurant)}
                      className="flex-1 bg-gradient-primary"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button
                      onClick={resetQuiz}
                      variant="outline"
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Fallback: Cuisine suggestion */}
                  <div className="text-center py-4">
                    <h3 className="text-2xl font-bold mb-2">
                      Try {recommendation.cuisine} cuisine!
                    </h3>
                    <p className="text-muted-foreground">
                      {recommendation.matchReason}
                    </p>
                  </div>
                  
                  <Button
                    onClick={resetQuiz}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Take Quiz Again
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-warm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Restaurant Quiz</CardTitle>
            <p className="text-muted-foreground mt-2">
              {restaurants.length > 0 
                ? `Answer a few questions and we will pick from ${restaurants.length} nearby restaurants!`
                : "Answer a few questions and we will find your perfect cuisine!"}
            </p>
            
            {/* Progress bar */}
            <div className="mt-4 flex gap-1">
              {QUIZ_QUESTIONS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index < Object.keys(answers).length
                      ? 'bg-primary'
                      : index === currentQuestion
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-6">{currentQ.question}</h3>
              
              <div className="grid gap-3">
                {currentQ.options.map((option) => (
                  <Button
                    key={option.value}
                    variant={answers[currentQ.id as keyof QuizAnswer] === option.value ? 'default' : 'outline'}
                    className="w-full py-6 text-lg justify-start px-6"
                    onClick={() => handleAnswer(currentQ.id, option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="ghost"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                Back
              </Button>
              
              {isComplete ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-gradient-primary"
                >
                  {isLoading ? (
                    'Finding your match...'
                  ) : (
                    <>
                      Find My Restaurant
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentQuestion(prev => Math.min(QUIZ_QUESTIONS.length - 1, prev + 1))}
                  disabled={!answers[currentQ.id as keyof QuizAnswer]}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Find;
