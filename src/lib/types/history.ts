
export interface HistoryMilestone {
  year: string;
  title: string;
  description: string;
  image?: string;
}

export type Milestone = HistoryMilestone;

export interface ImageSlide {
  id: number;
  src: string;
  alt: string;
  caption?: string;
}

