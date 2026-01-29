export interface Business {
  id: number;
  name: string;
  category: string;
  rating: number;
  reviews: number;
}

export interface RecentSearch {
  id: number;
  name: string;
  rating: number;
  verified: boolean;
  lastSearched: string;
}

export interface Review {
  id: number;
  name: string;
  verified: boolean;
  role?: string;
  brand:string;
  rating: number;
  content: string;
}

export interface VerificationStep {
  id: number;
  title: string;
  description: string;
}

