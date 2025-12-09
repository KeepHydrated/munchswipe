import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter } from 'lucide-react';

// Restaurant types that can be filtered out
export const FILTERABLE_TYPES = [
  { id: 'fast_food_restaurant', label: 'Fast Food', description: 'Quick service restaurants' },
  { id: 'meal_takeaway', label: 'Takeaway Only', description: 'Takeout-focused places' },
  { id: 'cafe', label: 'Cafes', description: 'Coffee shops and cafes' },
  { id: 'bakery', label: 'Bakeries', description: 'Bakeries and pastry shops' },
  { id: 'bar', label: 'Bars', description: 'Primarily drinking establishments' },
  { id: 'ice_cream_shop', label: 'Ice Cream', description: 'Ice cream and dessert shops' },
] as const;

export type FilterableType = typeof FILTERABLE_TYPES[number]['id'];

// Common fast food chain names to detect (since Google sometimes miscategorizes them)
export const FAST_FOOD_CHAINS = [
  "mcdonald's", "burger king", "wendy's", "taco bell", "kfc", "popeyes", 
  "chick-fil-a", "subway", "arby's", "sonic", "jack in the box", "hardee's",
  "carl's jr", "five guys", "in-n-out", "whataburger", "white castle",
  "checkers", "rally's", "del taco", "wingstop", "zaxby's", "raising cane's",
  "panda express", "chipotle", "qdoba", "moe's southwest", "jersey mike's",
  "jimmy john's", "firehouse subs", "potbelly", "panera", "dunkin'", 
  "krispy kreme", "starbucks", "tim hortons", "dairy queen", "culver's",
  "shake shack", "smashburger", "habit burger", "el pollo loco", "church's",
  "bojangles", "cook out", "freddy's", "steak 'n shake", "waffle house",
  "denny's", "ihop", "cracker barrel", "applebee's", "chili's", "tgi friday's",
  "buffalo wild wings", "hooters", "wingstop", "papa john's", "domino's",
  "pizza hut", "little caesars", "marco's pizza", "papa murphy's"
];

// Check if a restaurant name matches a known fast food chain
export const isFastFoodChain = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return FAST_FOOD_CHAINS.some(chain => lowerName.includes(chain));
};

interface RestaurantFiltersProps {
  excludedTypes: Set<FilterableType>;
  onExcludedTypesChange: (types: Set<FilterableType>) => void;
}

export const RestaurantFilters: React.FC<RestaurantFiltersProps> = ({
  excludedTypes,
  onExcludedTypesChange,
}) => {
  const handleToggle = (typeId: FilterableType) => {
    const newSet = new Set(excludedTypes);
    if (newSet.has(typeId)) {
      newSet.delete(typeId);
    } else {
      newSet.add(typeId);
    }
    onExcludedTypesChange(newSet);
  };

  const activeFiltersCount = excludedTypes.size;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-background">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-background border shadow-lg z-50" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Hide Restaurant Types</h4>
            <p className="text-xs text-muted-foreground">
              Select types to exclude from suggestions
            </p>
          </div>
          
          <div className="space-y-3">
            {FILTERABLE_TYPES.map((type) => (
              <div key={type.id} className="flex items-start space-x-3">
                <Checkbox
                  id={type.id}
                  checked={excludedTypes.has(type.id)}
                  onCheckedChange={() => handleToggle(type.id)}
                />
                <div className="grid gap-0.5 leading-none">
                  <Label
                    htmlFor={type.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {type.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => onExcludedTypesChange(new Set())}
            >
              Clear all filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
