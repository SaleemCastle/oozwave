#import "MusicLibraryModule.h"

#import <MediaPlayer/MediaPlayer.h>
#import <UIKit/UIKit.h>

@implementation MusicLibraryModule

RCT_EXPORT_MODULE(MusicLibrary)

- (void)withAuthorization:(void (^)(void))authorized rejecter:(RCTPromiseRejectBlock)reject
{
  MPMediaLibraryAuthorizationStatus status = [MPMediaLibrary authorizationStatus];
  if (status == MPMediaLibraryAuthorizationStatusAuthorized) {
    authorized();
    return;
  }

  if (status == MPMediaLibraryAuthorizationStatusNotDetermined) {
    [MPMediaLibrary requestAuthorization:^(MPMediaLibraryAuthorizationStatus newStatus) {
      if (newStatus == MPMediaLibraryAuthorizationStatusAuthorized) {
        authorized();
      } else {
        reject(@"permission_denied", @"Media library permission not granted.", nil);
      }
    }];
    return;
  }

  reject(@"permission_denied", @"Media library permission not granted.", nil);
}

- (NSInteger)intValueForKey:(NSString *)key from:(NSDictionary *)options fallback:(NSInteger)fallback
{
  id value = options[key];
  if ([value respondsToSelector:@selector(integerValue)]) {
    return [value integerValue];
  }
  return fallback;
}

- (NSString *)stringValueForKey:(NSString *)key from:(NSDictionary *)options
{
  id value = options[key];
  if ([value isKindOfClass:[NSString class]]) {
    return (NSString *)value;
  }
  return nil;
}

- (NSArray<MPMediaItem *> *)sortedItems:(NSArray<MPMediaItem *> *)items sortBy:(NSString *)sortBy order:(NSString *)sortOrder
{
  if (items.count == 0 || sortBy.length == 0) {
    return items;
  }

  NSString *upperSortBy = [sortBy uppercaseString];
  NSString *upperOrder = [sortOrder uppercaseString];
  BOOL descending = [upperOrder isEqualToString:@"DESC"];

  return [items sortedArrayUsingComparator:^NSComparisonResult(MPMediaItem *a, MPMediaItem *b) {
    NSString *left = @"";
    NSString *right = @"";
    if ([upperSortBy isEqualToString:@"TITLE"]) {
      left = a.title ?: @"";
      right = b.title ?: @"";
    } else if ([upperSortBy isEqualToString:@"ALBUM"]) {
      left = a.albumTitle ?: @"";
      right = b.albumTitle ?: @"";
    } else if ([upperSortBy isEqualToString:@"ARTIST"]) {
      left = a.artist ?: @"";
      right = b.artist ?: @"";
    } else {
      return NSOrderedSame;
    }

    NSComparisonResult result = [left localizedCaseInsensitiveCompare:right];
    return descending ? (NSComparisonResult)(-result) : result;
  }];
}

- (NSString *)base64CoverForItem:(MPMediaItem *)item quality:(CGFloat)quality
{
  if (quality <= 0) {
    return nil;
  }

  MPMediaItemArtwork *artwork = item.artwork;
  if (!artwork) {
    return nil;
  }

  CGFloat clampedQuality = MIN(MAX(quality, 0.1), 1.0);
  CGFloat size = 120.0 + (clampedQuality * 480.0);
  UIImage *image = [artwork imageWithSize:CGSizeMake(size, size)];
  if (!image) {
    return nil;
  }

  NSData *data = UIImageJPEGRepresentation(image, clampedQuality);
  if (!data) {
    return nil;
  }

  return [data base64EncodedStringWithOptions:0];
}

- (void)fetchSongsWithOptions:(NSDictionary *)options
                   searchTerm:(NSString *)searchTerm
                     searchBy:(NSString *)searchBy
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject
{
  [self withAuthorization:^{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      MPMediaQuery *query = [MPMediaQuery songsQuery];
      NSArray<MPMediaItem *> *items = query.items ?: @[];

      NSInteger minDurationMs = [self intValueForKey:@"minimumSongDuration" from:options fallback:0];
      if (minDurationMs <= 0) {
        minDurationMs = [self intValueForKey:@"minSongDuration" from:options fallback:0];
      }

      NSInteger batchSize = [self intValueForKey:@"batchSize" from:options fallback:0];
      NSInteger batchNumber = [self intValueForKey:@"batchNumber" from:options fallback:0];
      NSInteger offset = (batchSize > 0 && batchNumber > 0) ? (batchSize * batchNumber) : 0;

      NSString *sortBy = [self stringValueForKey:@"sortBy" from:options] ?: @"";
      NSString *sortOrder = [self stringValueForKey:@"sortOrder" from:options] ?: @"ASC";

      items = [self sortedItems:items sortBy:sortBy order:sortOrder];

      NSMutableArray<NSDictionary *> *tracks = [NSMutableArray array];
      NSString *term = searchTerm;
      NSString *termLower = term.length > 0 ? [term lowercaseString] : nil;
      NSString *searchKey = searchBy.length > 0 ? [searchBy uppercaseString] : @"TITLE";

      CGFloat quality = 0.0;
      id coverQuality = options[@"coverQuality"];
      if ([coverQuality respondsToSelector:@selector(doubleValue)]) {
        quality = (CGFloat)[coverQuality doubleValue] / 100.0;
      }
      id cover = options[@"cover"];
      if ([cover isKindOfClass:[NSNumber class]] && ![(NSNumber *)cover boolValue]) {
        quality = 0.0;
      }

      NSInteger index = 0;
      for (MPMediaItem *item in items) {
        NSURL *assetURL = [item valueForProperty:MPMediaItemPropertyAssetURL];
        if (!assetURL) {
          continue;
        }

        NSTimeInterval durationSec = item.playbackDuration;
        if (minDurationMs > 0 && (durationSec * 1000.0) < (double)minDurationMs) {
          continue;
        }

        if (termLower) {
          NSString *candidate = @"";
          if ([searchKey isEqualToString:@"ALBUM"]) {
            candidate = item.albumTitle ?: @"";
          } else if ([searchKey isEqualToString:@"ARTIST"]) {
            candidate = item.artist ?: @"";
          } else {
            candidate = item.title ?: @"";
          }
          if ([[candidate lowercaseString] rangeOfString:termLower].location == NSNotFound) {
            continue;
          }
        }

        if (offset > 0 && index < offset) {
          index += 1;
          continue;
        }

        NSNumber *persistentId = [item valueForProperty:MPMediaItemPropertyPersistentID];
        NSMutableDictionary *track = [@{
          @"id": persistentId ?: @(index),
          @"title": item.title ?: @"",
          @"artist": item.artist ?: @"",
          @"album": item.albumTitle ?: @"",
          @"duration": @((NSInteger)(durationSec * 1000.0)),
          @"path": assetURL.absoluteString ?: @""
        } mutableCopy];

        NSString *coverBase64 = [self base64CoverForItem:item quality:quality];
        if (coverBase64) {
          track[@"cover"] = coverBase64;
        }

        [tracks addObject:track];
        index += 1;

        if (batchSize > 0 && tracks.count >= batchSize) {
          break;
        }
      }

      resolve(@{
        @"results": tracks,
        @"length": @(tracks.count),
      });
    });
  } rejecter:reject];
}

RCT_REMAP_METHOD(getAll,
                 getAllWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *safeOptions = options ?: @{};
  [self fetchSongsWithOptions:safeOptions searchTerm:nil searchBy:nil resolve:resolve reject:reject];
}

RCT_REMAP_METHOD(search,
                 searchWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *safeOptions = options ?: @{};
  NSString *term = [self stringValueForKey:@"searchParam" from:safeOptions];
  NSString *searchField = [self stringValueForKey:@"searchBy" from:safeOptions];
  [self fetchSongsWithOptions:safeOptions searchTerm:term searchBy:searchField resolve:resolve reject:reject];
}

RCT_REMAP_METHOD(getAlbums,
                 getAlbumsWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self withAuthorization:^{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      MPMediaQuery *query = [MPMediaQuery albumsQuery];
      NSArray<MPMediaItemCollection *> *collections = query.collections ?: @[];
      NSMutableArray<NSDictionary *> *albums = [NSMutableArray array];

      for (MPMediaItemCollection *collection in collections) {
        MPMediaItem *representative = collection.representativeItem;
        if (!representative) {
          continue;
        }
        NSString *album = representative.albumTitle ?: @"";
        NSString *artist = representative.albumArtist ?: representative.artist ?: @"";
        NSNumber *count = @(collection.items.count);

        NSMutableDictionary *entry = [@{
          @"album": album,
          @"artist": artist,
          @"numberOfSongs": count,
        } mutableCopy];

        NSString *coverBase64 = [self base64CoverForItem:representative quality:0.7];
        if (coverBase64) {
          entry[@"cover"] = coverBase64;
        }

        [albums addObject:entry];
      }

      resolve(@{
        @"results": albums,
        @"length": @(albums.count),
      });
    });
  } rejecter:reject];
}

RCT_REMAP_METHOD(getArtists,
                 getArtistsResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@{ @"results": @[], @"length": @0 });
}

RCT_REMAP_METHOD(getSongs,
                 getSongsResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@{ @"results": @[], @"length": @0 });
}

RCT_REMAP_METHOD(getSongByPath,
                 getSongByPathOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *path = [self stringValueForKey:@"path" from:options];
  if (path.length == 0) {
    reject(@"invalid_path", @"A path must be provided.", nil);
    return;
  }
  resolve(@{
    @"id": @0,
    @"path": path,
  });
}

RCT_REMAP_METHOD(getSongsByPaths,
                 getSongsByPathsResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@{ @"results": @[], @"length": @0 });
}

@end
