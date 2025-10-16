import { ImageProps, ImageSourcePropType } from 'react-native';

export declare namespace Constants {
  namespace SortBy {
    const Artist: string;
    const Album: string;
    const Title: string;
  }
  namespace SortOrder {
    const Ascending: string;
    const Descending: string;
  }
}

export interface ICoverImageProps extends ImageProps {
  src?: string;
  source?: string | ImageSourcePropType;
  placeHolder?: ImageSourcePropType | string;
  width?: number;
  height?: number;
}

export declare const CoverImage: React.FC<ICoverImageProps>;

export interface ITrack {
  album: string;
  artist: string;
  cover?: string;
  duration: number;
  id: number;
  path: string;
  title: string;
}

export interface SongOptions {
  cover?: boolean;
  coverQuality?: number;
  batchSize?: number;
  batchNumber?: number;
  minimumSongDuration?: number;
  minSongDuration?: number;
  sortBy?: string;
  sortOrder?: string;
  searchParam?: string;
  searchBy?: string;
}

export interface Album {
  album: string;
  artist: string;
  cover?: string;
  numberOfSongs: number;
}

export interface ResponseShape<T> {
  results: T[];
  length: number;
}

declare const MusicFiles: {
  getAll(options?: SongOptions): Promise<ResponseShape<ITrack>>;
  search(options?: SongOptions): Promise<ResponseShape<ITrack>>;
  getAlbums(options?: Record<string, unknown>): Promise<ResponseShape<Album>>;
  getArtists(): Promise<ResponseShape<Record<string, unknown>>>;
  getSongs(): Promise<ResponseShape<ITrack>>;
  getSongByPath(options: { path: string }): Promise<Partial<ITrack>>;
  getSongsByPaths(): Promise<ResponseShape<ITrack>>;
};

export default MusicFiles;
