export type SongInput = {
  title: string;
  artist?: string;
  lyrics: string;
  source?: string;
};

export type TranslationResult = {
  titlePt: string;
  titleRomaji: string;
  artist: string;
  romajiLines: string[];
  portugueseLines: string[];
};
