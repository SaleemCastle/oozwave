const React = require('react');
const { Image } = require('react-native');
const {
  getAll: coreGetAll,
  getAlbums: coreGetAlbums,
  searchSongs: coreSearchSongs,
  SortSongFields,
  SortSongOrder,
} = require('react-native-get-music-files');

const coverCache = new Map();

const Constants = {
  SortBy: {
    Title: SortSongFields.TITLE,
    Album: SortSongFields.ALBUM,
    Artist: SortSongFields.ARTIST,
  },
  SortOrder: {
    Ascending: SortSongOrder.ASC,
    Descending: SortSongOrder.DESC,
  },
};

const hashFromString = (input, fallback) => {
  if (!input) {
    return fallback ?? 0;
  }
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const normaliseDuration = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return 0;
};

const normaliseCover = (cover) => {
  if (!cover) {
    return undefined;
  }
  if (typeof cover === 'string' && cover.startsWith('data:')) {
    return cover;
  }
  return `data:image/jpeg;base64,${cover}`;
};

const toTrack = (song, index) => {
  const path = song?.url ?? '';
  const cover = normaliseCover(song?.cover);
  if (cover) {
    coverCache.set(path, cover);
  }
  return {
    id: hashFromString(path, index ?? 0),
    path,
    album: song?.album ?? '',
    artist: song?.artist ?? '',
    title: song?.title ?? '',
    duration: normaliseDuration(song?.duration),
    cover,
  };
};

const buildResult = (items) => ({
  results: items,
  length: items.length,
});

const VALID_SORT_FIELDS = new Set(Object.values(SortSongFields));
const VALID_SORT_ORDERS = new Set(Object.values(SortSongOrder));

const mapSongOptions = (options = {}) => {
  const mapped = {};
  const batchSize = Number(options.batchSize ?? options.limit);
  const batchNumber = Number(options.batchNumber ?? options.offset);

  if (Number.isFinite(batchSize) && batchSize > 0) {
    mapped.limit = batchSize;
    if (Number.isFinite(batchNumber) && batchNumber >= 0) {
      mapped.offset = Math.trunc(batchNumber) * batchSize;
    }
  }

  const minDuration = options.minimumSongDuration ?? options.minSongDuration;
  if (Number.isFinite(Number(minDuration))) {
    mapped.minSongDuration = Number(minDuration);
  }

  const sortBy = options.sortBy;
  if (sortBy) {
    const candidate = sortBy.toString().toUpperCase();
    if (VALID_SORT_FIELDS.has(candidate)) {
      mapped.sortBy = candidate;
    }
  }

  const sortOrder = options.sortOrder;
  if (sortOrder) {
    const candidate = sortOrder.toString().toUpperCase();
    if (VALID_SORT_ORDERS.has(candidate)) {
      mapped.sortOrder = candidate;
    }
  }

  if (Number.isFinite(Number(options.coverQuality))) {
    mapped.coverQuality = Number(options.coverQuality);
  } else if (options.cover === false) {
    mapped.coverQuality = 0;
  }

  return mapped;
};

const mapAlbums = (albums) =>
  buildResult(
    (albums || []).map((album, index) => ({
      id: hashFromString(`${album?.album ?? ''}-${album?.artist ?? ''}`, index),
      album: album?.album ?? '',
      artist: album?.artist ?? '',
      numberOfSongs: Number(album?.numberOfSongs ?? 0),
      cover: normaliseCover(album?.cover),
    })),
  );

const assertNotError = (raw) => {
  if (typeof raw === 'string') {
    throw new Error(raw);
  }
  return raw ?? [];
};

const MusicFiles = {
  async getAll(options) {
    const mapped = mapSongOptions(options);
    const response = await coreGetAll(mapped);
    const tracks = assertNotError(response).map((song, index) => toTrack(song, index));
    return buildResult(tracks);
  },
  async search(options) {
    const mapped = mapSongOptions(options);
    const response = await coreSearchSongs({
      ...mapped,
      searchBy: options?.searchParam ?? options?.searchBy,
    });
    const tracks = assertNotError(response).map((song, index) => toTrack(song, index));
    return buildResult(tracks);
  },
  async getAlbums(options) {
    const response = await coreGetAlbums(options);
    return mapAlbums(assertNotError(response));
  },
  async getArtists() {
    return buildResult([]);
  },
  async getSongs() {
    return buildResult([]);
  },
  async getSongByPath({ path }) {
    if (!path) {
      throw new Error('A path must be provided');
    }
    const cover = coverCache.get(path);
    return {
      id: hashFromString(path),
      path,
      cover,
    };
  },
  async getSongsByPaths() {
    return buildResult([]);
  },
};

const CoverImage = React.memo(function CoverImage(props) {
  const { src, source, placeHolder, width, height, style, ...rest } = props;
  let resolvedPath;
  if (typeof source === 'string') {
    resolvedPath = source;
  } else if (source && typeof source === 'object' && source.uri) {
    resolvedPath = source.uri;
  } else if (typeof src === 'string') {
    resolvedPath = src;
  }

  const cover = resolvedPath ? coverCache.get(resolvedPath) : undefined;

  let finalSource;
  if (cover) {
    finalSource = { uri: cover };
  } else if (placeHolder) {
    finalSource = typeof placeHolder === 'string' ? { uri: placeHolder } : placeHolder;
  }

  if (!finalSource) {
    return null;
  }

  const sizeStyle = {};
  if (typeof width === 'number') {
    sizeStyle.width = width;
  }
  if (typeof height === 'number') {
    sizeStyle.height = height;
  }

  const styles = [];
  if (Object.keys(sizeStyle).length > 0) {
    styles.push(sizeStyle);
  }
  if (style) {
    styles.push(style);
  }

  return React.createElement(Image, {
    ...rest,
    source: finalSource,
    style: styles.length === 0 ? undefined : styles.length === 1 ? styles[0] : styles,
  });
});

module.exports = MusicFiles;
module.exports.default = MusicFiles;
module.exports.Constants = Constants;
module.exports.CoverImage = CoverImage;