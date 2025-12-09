import React from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin } from 'lucide-react';

const Find = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-warm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Find Restaurants</CardTitle>
            <p className="text-muted-foreground mt-2">
              Search for specific restaurants in your area
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5" />
              <span>Coming soon...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Find;
