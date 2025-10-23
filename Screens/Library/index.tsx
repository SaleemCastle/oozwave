import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import styled from 'styled-components/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'

import { Colors, Images } from '../../Constants'
import { McText, McVectorIcon, ConfirmDialog, NeonButton } from '../../Components'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { LibraryProps } from '../../types'
import { ITrack } from '../../Store/Actions/currentTrack.actions'
import { playlistActions, selectSortedAndFilteredPlaylists } from '../../state/playlists'
import { colors as themeColors } from '../../theme/tokens'
import { playTracksNow } from '../../state/playerQueue'
import { trackToQueueItem } from '../../state/playerQueue/utils'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type SectionKey = 'Playlists' | 'Songs' | 'Albums' | 'Artists'

const STORAGE_KEYS = {
  search: (section: SectionKey) => `@library/search:${section}`,
  offline: '@library/offlineMap:v1',
}

const SORT_OPTIONS_SONGS = [
  { label: 'A - Z', value: 'alpha' as const },
  { label: 'Artist', value: 'artist' as const },
  { label: 'Duration', value: 'duration' as const },
  { label: 'Recent', value: 'recent' as const },
]

const SORT_OPTIONS_COLLECTION = [
  { label: 'A - Z', value: 'alpha' as const },
  { label: 'Size', value: 'size' as const },
  { label: 'Recent', value: 'recent' as const },
]

type SongSort = typeof SORT_OPTIONS_SONGS[number]['value']

type OfflineMap = {
  tracks: Record<string, boolean>
  albums: Record<string, boolean>
  artists: Record<string, boolean>
  playlists: Record<string, boolean>
}

const defaultOffline: OfflineMap = { tracks: {}, albums: {}, artists: {}, playlists: {} }

const soundMatchScore = (aRaw: string, bRaw: string) => {
  const a = aRaw.toLowerCase().trim()
  const b = bRaw.toLowerCase().trim()
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.9
  const dist = (s: string, t: string) => {
    const dp: number[][] = Array.from({ length: s.length + 1 }, () => Array(t.length + 1).fill(0))
    for (let i = 0; i <= s.length; i++) dp[i][0] = i
    for (let j = 0; j <= t.length; j++) dp[0][j] = j
    for (let i = 1; i <= s.length; i++) {
      for (let j = 1; j <= t.length; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        )
      }
    }
    return dp[s.length][t.length]
  }
  const d = dist(a, b)
  const worst = Math.max(a.length, b.length)
  const score = Math.max(0, 1 - d / Math.max(1, worst))
  return score
}

const Library: React.FC<LibraryProps> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const tracks = useAppSelector((s) => s.tracks as ITrack[])
  const playlists = useAppSelector(selectSortedAndFilteredPlaylists)

  const [section, setSection] = useState<SectionKey>('Playlists')
  const [query, setQuery] = useState('')
  const [soundMatch, setSoundMatch] = useState(true)
  const [songSort, setSongSort] = useState<SongSort>('alpha')
  const [collectionSort, setCollectionSort] = useState<'alpha' | 'size' | 'recent'>('alpha')
  const [offline, setOffline] = useState<OfflineMap>(defaultOffline)
  const [confirm, setConfirm] = useState<{ visible: boolean; title?: string; message?: string; onConfirm?: () => void }>({ visible: false })

  const loadPersisted = useCallback(async () => {
    try {
      const [storedQuery, storedOffline] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.search(section)),
        AsyncStorage.getItem(STORAGE_KEYS.offline),
      ])
      if (storedQuery != null) setQuery(storedQuery)
      if (storedOffline) setOffline({ ...defaultOffline, ...JSON.parse(storedOffline) })
    } catch {
      // ignore
    }
  }, [section])

  useEffect(() => {
    loadPersisted()
  }, [loadPersisted])

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.search(section), query).catch(() => {})
  }, [query, section])

  const handleCreatePlaylist = useCallback(() => {
    navigation.navigate('PlaylistEditor', { mode: 'create' })
  }, [navigation])

  const toggleOffline = useCallback((scope: keyof OfflineMap, id: string) => {
    setOffline((prev) => {
      const next = { ...prev, [scope]: { ...prev[scope], [id]: !prev[scope][id] } }
      AsyncStorage.setItem(STORAGE_KEYS.offline, JSON.stringify(next)).catch(() => {})
      return next
    })
  }, [])

  const filteredTracks: ITrack[] = useMemo(() => {
    if (!query.trim()) return tracks
    const q = query.trim()
    return tracks.filter((t) => {
      const fields = [t.title, t.artist, t.album].filter(Boolean) as string[]
      if (soundMatch) {
        return fields.some((f) => soundMatchScore(f, q) > 0.6)
      }
      const lq = q.toLowerCase()
      return fields.some((f) => f.toLowerCase().includes(lq))
    })
  }, [query, soundMatch, tracks])

  const sortedTracks = useMemo(() => {
    const arr = [...filteredTracks]
    switch (songSort) {
      case 'artist':
        return arr.sort((a, b) => (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' }))
      case 'duration':
        return arr.sort((a, b) => (a.duration || 0) - (b.duration || 0))
      case 'recent':
        return arr.sort((a, b) => Number(b.id) - Number(a.id))
      case 'alpha':
      default:
        return arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }))
    }
  }, [filteredTracks, songSort])

  const albums = useMemo(() => {
    const groups = new Map<string, { album: string; artist?: string; count: number; sample?: ITrack; maxId: number }>()
    sortedTracks.forEach((t) => {
      const key = (t.album || 'Unknown').trim()
      const idNum = Number(t.id)
      const existing = groups.get(key) || { album: key, artist: t.artist, count: 0 as number, sample: t, maxId: -Infinity }
      existing.count += 1
      existing.artist = existing.artist || t.artist
      existing.sample = existing.sample || t
      existing.maxId = Math.max(existing.maxId, isNaN(idNum) ? -Infinity : idNum)
      groups.set(key, existing)
    })
    const arr = Array.from(groups.values())
    switch (collectionSort) {
      case 'size':
        return arr.sort((a, b) => b.count - a.count)
      case 'recent':
        return arr.sort((a, b) => b.maxId - a.maxId)
      case 'alpha':
      default:
        return arr.sort((a, b) => a.album.localeCompare(b.album, undefined, { sensitivity: 'base' }))
    }
  }, [sortedTracks, collectionSort])

  const artists = useMemo(() => {
    const groups = new Map<string, { artist: string; count: number; sample?: ITrack; maxId: number }>()
    sortedTracks.forEach((t) => {
      const key = (t.artist || 'Unknown').trim()
      const idNum = Number(t.id)
      const existing = groups.get(key) || { artist: key, count: 0 as number, sample: t, maxId: -Infinity }
      existing.count += 1
      existing.sample = existing.sample || t
      existing.maxId = Math.max(existing.maxId, isNaN(idNum) ? -Infinity : idNum)
      groups.set(key, existing)
    })
    const arr = Array.from(groups.values())
    switch (collectionSort) {
      case 'size':
        return arr.sort((a, b) => b.count - a.count)
      case 'recent':
        return arr.sort((a, b) => b.maxId - a.maxId)
      case 'alpha':
      default:
        return arr.sort((a, b) => a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' }))
    }
  }, [sortedTracks, collectionSort])

  const memoryLane = useMemo(() => {
    const recent = [...tracks].slice(0, 12)
    const throwbacks = [...tracks].reverse().slice(0, 12)
    return [
      { id: 'recent', title: 'Recently Added', items: recent },
      { id: 'throwbacks', title: 'Throwbacks', items: throwbacks },
    ]
  }, [tracks])

  const handlePlayTrack = useCallback((track: ITrack) => {
    const queueItem = trackToQueueItem(track)
    if (!queueItem) {
      Alert.alert('Unable to play', 'Track is missing a valid file path.')
      return
    }
    dispatch(playTracksNow([queueItem]))
    navigation.navigate('Player')
  }, [dispatch, navigation])

  const playMultiple = useCallback((list: ITrack[]) => {
    // Convert to queue items, drop heavy artwork to reduce memory usage for large queues
    const all = list
      .map(trackToQueueItem)
      .filter(Boolean)
      .map((item) => ({ ...(item as any), artwork: undefined })) as any[]

    if (!all.length) {
      Alert.alert('Nothing to play', 'No playable tracks found.')
      return
    }

    // Guard against extremely large queues causing native crashes
    const MAX_BULK_ADD = 1000
    const items = all.slice(0, MAX_BULK_ADD)
    if (all.length > MAX_BULK_ADD) {
      Alert.alert(
        'Playing first 1000 tracks',
        `Limited to ${MAX_BULK_ADD} tracks to keep things stable.`,
      )
    }

    dispatch(playTracksNow(items))
    navigation.navigate('Player')
  }, [dispatch, navigation])

  const headerRightSync = useCallback(() => {
    Alert.alert('Sync', 'Cross-device sync coming soon.')
  }, [])

  const renderToolbar = () => (
    <HeaderRow>
      <McText extra size={22} color={Colors.primary}>Library</McText>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={headerRightSync} style={{ padding: 8 }}>
          <McVectorIcon type="Feather" name="cloud" color={Colors.grey4} size={20} />
        </TouchableOpacity>
      </View>
    </HeaderRow>
  )

  const renderTabs = () => (
    <TabsRow>
      {(['Playlists', 'Songs', 'Albums', 'Artists'] as SectionKey[]).map((key) => (
        <TabPill key={key} active={section === key} onPress={() => { LayoutAnimation.easeInEaseOut(); setSection(key) }}>
          <McText medium size={12} color={section === key ? Colors.white : Colors.grey4}>{key}</McText>
        </TabPill>
      ))}
    </TabsRow>
  )

  const renderSearchBar = () => (
    <SearchBar>
      <McVectorIcon type="Feather" name="search" color={Colors.grey3} size={18} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={`Search ${section.toLowerCase()}`}
        placeholderTextColor={Colors.grey3}
        style={{ flex: 1, marginLeft: 8, color: Colors.grey4 }}
      />
      <TouchableOpacity onPress={() => setSoundMatch((s) => !s)}>
        <McText medium size={11} color={soundMatch ? themeColors.neonMagenta : Colors.grey3}>Sound-Match</McText>
      </TouchableOpacity>
    </SearchBar>
  )

  const renderSortRow = () => (
    <SortRow>
      {section === 'Playlists' ? (
        <SortButton onPress={() => dispatch(playlistActions.setSortBy('recent'))}>
          <McText semi size={12} color={Colors.grey4}>Sort: Recent</McText>
        </SortButton>
      ) : section === 'Songs' ? (
        <View style={{ flexDirection: 'row' }}>
          {SORT_OPTIONS_SONGS.map((opt) => (
            <SortButton key={opt.value} onPress={() => setSongSort(opt.value)}>
              <McText semi size={12} color={songSort === opt.value ? Colors.white : Colors.grey4}>{opt.label}</McText>
            </SortButton>
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: 'row' }}>
          {SORT_OPTIONS_COLLECTION.map((opt) => (
            <SortButton key={opt.value} onPress={() => setCollectionSort(opt.value)}>
              <McText semi size={12} color={collectionSort === opt.value ? Colors.white : Colors.grey4}>{opt.label}</McText>
            </SortButton>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row' }}>
        {section === 'Songs' && (
          <NeonButton circular size={44} onPress={() => playMultiple(sortedTracks)} icon={<McVectorIcon type="Feather" name="play" color={Colors.white} size={20} />} />
        )}
        <View style={{ width: 8 }} />
        <NeonButton circular size={44} onPress={handleCreatePlaylist} icon={<McVectorIcon type="Feather" name="plus" color={Colors.white} size={20} />} />
      </View>
    </SortRow>
  )

  const renderMemoryLane = () => (
    <View style={{ marginVertical: 12 }}>
      <McText semi size={16} color={Colors.grey4}>Memory Lane</McText>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 8 }}
        contentContainerStyle={{}}
        keyExtractor={(pl) => String(pl.id)}
        data={memoryLane}
        renderItem={({ item }) => (
          <MemoryCard>
            <McText bold size={14} color={Colors.white}>{item.title}</McText>
            <McText size={11} color={Colors.grey3} style={{ marginTop: 4 }}>{item.items.length} tracks</McText>
          </MemoryCard>
        )}
      />
    </View>
  )

  const renderPlaylists = () => (
    <FlatList
      style={{ marginTop: 8 }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      data={playlists}
      keyExtractor={(pl) => pl.id}
      ListEmptyComponent={<EmptyState title="No playlists yet" subtitle="Create your first playlist to get started." onAction={handleCreatePlaylist} />}
      renderItem={({ item }) => (
        <CollectionCard onLongPress={() => setConfirm({ visible: true, title: 'Offline', message: 'Make playlist available offline?', onConfirm: () => toggleOffline('playlists', item.id) })}>
          <McText semi size={14} color={Colors.grey5} numberOfLines={1}>{item.name}</McText>
          <McText size={11} color={Colors.grey3} style={{ marginTop: 4 }}>{item.trackIds.length} tracks</McText>
          <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
            <Row>
              <McVectorIcon type="Feather" name="music" color={Colors.grey4} size={14} />
              <McText size={11} color={Colors.grey4} style={{ marginLeft: 6 }}>Open</McText>
            </Row>
            <TouchableOpacity onPress={() => toggleOffline('playlists', item.id)}>
              <McVectorIcon type="Feather" name={offline.playlists[item.id] ? 'download' : 'download-cloud'} color={Colors.accent} size={16} />
            </TouchableOpacity>
          </Row>
        </CollectionCard>
      )}
    />
  )

  const renderSongs = () => (
    <FlatList
      style={{ marginTop: 8 }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      data={sortedTracks}
      keyExtractor={(t) => String(t.id)}
      ListHeaderComponent={renderMemoryLane()}
      renderItem={({ item }) => (
        <SongRow onPress={() => handlePlayTrack(item)} onLongPress={() => setConfirm({ visible: true, title: 'Offline', message: 'Make song available offline?', onConfirm: () => toggleOffline('tracks', String(item.id)) })}>
          <CoverImage //@ts-ignore
            src={item.path}
            placeHolder={ Images.DefaultMusicIcon }
            width={48}
            height={48}
            style={{borderRadius: 2}}
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <McText bold size={13} color={Colors.grey5} numberOfLines={1}>{item.title || 'Unknown'}</McText>
            <McText size={11} color={Colors.grey3} numberOfLines={1} style={{ marginTop: 2 }}>{item.artist || 'Unknown'} {' - '} {item.album || 'Unknown'}</McText>
          </View>
          <TouchableOpacity onPress={() => toggleOffline('tracks', String(item.id))}>
            <McVectorIcon type="Feather" name={offline.tracks[String(item.id)] ? 'download' : 'download-cloud'} color={Colors.accent} size={18} />
          </TouchableOpacity>
        </SongRow>
      )}
    />
  )

  const renderAlbums = () => (
    <FlatList
      style={{ marginTop: 8 }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      data={albums}
      keyExtractor={(a) => a.album}
      renderItem={({ item }) => (
        <CollectionCard
          onPress={() => playMultiple(tracks.filter((t) => (t.album || 'Unknown').trim() === item.album))}
          onLongPress={() => setConfirm({ visible: true, title: 'Offline', message: 'Make album available offline?', onConfirm: () => toggleOffline('albums', item.album) })}
        >
          <CoverImage //@ts-ignore
            src={item.sample?.path}
            width={84}
            height={84}
          />
          <McText semi size={14} color={Colors.grey5} numberOfLines={1} style={{ marginTop: 8 }}>{item.album}</McText>
          <McText size={11} color={Colors.grey3} style={{ marginTop: 4 }} numberOfLines={1}>{item.artist || 'Various'} {' - '} {item.count} songs</McText>
          <Row style={{ marginTop: 8, justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={() => toggleOffline('albums', item.album)}>
              <McVectorIcon type="Feather" name={offline.albums[item.album] ? 'download' : 'download-cloud'} color={Colors.accent} size={16} />
            </TouchableOpacity>
          </Row>
        </CollectionCard>
      )}
    />
  )

  const renderArtists = () => (
    <FlatList
      style={{ marginTop: 8 }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      data={artists}
      keyExtractor={(a) => a.artist}
      renderItem={({ item }) => (
        <ArtistRow
          onPress={() => playMultiple(tracks.filter((t) => (t.artist || 'Unknown').trim() === item.artist))}
          onLongPress={() => setConfirm({ visible: true, title: 'Offline', message: 'Make artist available offline?', onConfirm: () => toggleOffline('artists', item.artist) })}
        >
          <AvatarCircle>
            <McText bold size={14} color={Colors.white}>{(item.artist || 'U').slice(0,1).toUpperCase()}</McText>
          </AvatarCircle>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <McText semi size={14} color={Colors.grey5} numberOfLines={1}>{item.artist}</McText>
            <McText size={11} color={Colors.grey3} numberOfLines={1} style={{ marginTop: 2 }}>{item.count} songs</McText>
          </View>
          <TouchableOpacity onPress={() => toggleOffline('artists', item.artist)}>
            <McVectorIcon type="Feather" name={offline.artists[item.artist] ? 'download' : 'download-cloud'} color={Colors.accent} size={18} />
          </TouchableOpacity>
        </ArtistRow>
      )}
    />
  )

  const renderHeaderCommon = () => (
    <View>
      {renderToolbar()}
      {renderTabs()}
      {renderSearchBar()}
      {renderSortRow()}
    </View>
  )

  return (
    <Container>
      <StatusBar hidden />
      {section === 'Playlists' && (
        <FlatList
          data={playlists}
          keyExtractor={(pl) => pl.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          ListHeaderComponent={renderHeaderCommon()}
          ListEmptyComponent={<EmptyState title="No playlists yet" subtitle="Create your first playlist to get started." onAction={handleCreatePlaylist} />}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <CollectionCard onLongPress={() => setConfirm({ visible: true, title: 'Offline', message: 'Make playlist available offline?', onConfirm: () => toggleOffline('playlists', item.id) })}>
              <McText semi size={14} color={Colors.grey5} numberOfLines={1}>{item.name}</McText>
              <McText size={11} color={Colors.grey3} style={{ marginTop: 4 }}>{item.trackIds.length} tracks</McText>
              <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
                <Row>
                  <McVectorIcon type="Feather" name="music" color={Colors.grey4} size={14} />
                  <McText size={11} color={Colors.grey4} style={{ marginLeft: 6 }}>Open</McText>
                </Row>
                <TouchableOpacity onPress={() => toggleOffline('playlists', item.id)}>
                  <McVectorIcon type="Feather" name={offline.playlists[item.id] ? 'download' : 'download-cloud'} color={Colors.accent} size={16} />
                </TouchableOpacity>
              </Row>
            </CollectionCard>
          )}
        />
      )}

      {section === 'Songs' && (
        <FlatList
          data={sortedTracks}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          ListHeaderComponent={<View>{renderHeaderCommon()}{renderMemoryLane()}</View>}
          renderItem={({ item }) => (
            <SongRow onPress={() => handlePlayTrack(item)} onLongPress={() => setConfirm({ visible: true, title: 'Offline', message: 'Make song available offline?', onConfirm: () => toggleOffline('tracks', String(item.id)) })}>
              <CoverImage //@ts-ignore
                src={item.path}
                placeHolder={ Images.DefaultMusicIcon }
                width={48}
                height={48}
                style={{borderRadius: 2}}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <McText bold size={13} color={Colors.grey5} numberOfLines={1}>{item.title || 'Unknown'}</McText>
                <McText size={11} color={Colors.grey3} numberOfLines={1} style={{ marginTop: 2 }}>{item.artist || 'Unknown'} {' - '} {item.album || 'Unknown'}</McText>
              </View>
              <TouchableOpacity onPress={() => toggleOffline('tracks', String(item.id))}>
                <McVectorIcon type="Feather" name={offline.tracks[String(item.id)] ? 'download' : 'download-cloud'} color={Colors.accent} size={18} />
              </TouchableOpacity>
            </SongRow>
          )}
        />
      )}

      {section === 'Albums' && (
        <FlatList
          data={albums}
          keyExtractor={(a) => a.album}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          ListHeaderComponent={renderHeaderCommon()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <CollectionCard
              onPress={() => playMultiple(tracks.filter((t) => (t.album || 'Unknown').trim() === item.album))}
              onLongPress={() => setConfirm({ visible: true, title: 'Offline', message: 'Make album available offline?', onConfirm: () => toggleOffline('albums', item.album) })}
            >
              <CoverImage //@ts-ignore
                src={ item.sample?.path }
                width={84}
                height={84}
              />
              <McText semi size={14} color={Colors.grey5} numberOfLines={1} style={{ marginTop: 8 }}>{item.album}</McText>
              <McText size={11} color={Colors.grey3} style={{ marginTop: 4 }} numberOfLines={1}>{item.artist || 'Various'} {' - '} {item.count} songs</McText>
              <Row style={{ marginTop: 8, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => toggleOffline('albums', item.album)}>
                  <McVectorIcon type="Feather" name={offline.albums[item.album] ? 'download' : 'download-cloud'} color={Colors.accent} size={16} />
                </TouchableOpacity>
              </Row>
            </CollectionCard>
          )}
        />
      )}

      {section === 'Artists' && (
        <FlatList
          data={artists}
          keyExtractor={(a) => a.artist}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          ListHeaderComponent={renderHeaderCommon()}
          renderItem={({ item }) => (
            <ArtistRow
              onPress={() => playMultiple(tracks.filter((t) => (t.artist || 'Unknown').trim() === item.artist))}
              onLongPress={() => setConfirm({ visible: true, title: 'Offline', message: 'Make artist available offline?', onConfirm: () => toggleOffline('artists', item.artist) })}
            >
              <AvatarCircle>
                <McText bold size={14} color={Colors.white}>{(item.artist || 'U').slice(0,1).toUpperCase()}</McText>
              </AvatarCircle>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <McText semi size={14} color={Colors.grey5} numberOfLines={1}>{item.artist}</McText>
                <McText size={11} color={Colors.grey3} numberOfLines={1} style={{ marginTop: 2 }}>{item.count} songs</McText>
              </View>
              <TouchableOpacity onPress={() => toggleOffline('artists', item.artist)}>
                <McVectorIcon type="Feather" name={offline.artists[item.artist] ? 'download' : 'download-cloud'} color={Colors.accent} size={18} />
              </TouchableOpacity>
            </ArtistRow>
          )}
        />
      )}

      <ConfirmDialog
        visible={confirm.visible}
        title={confirm.title ?? ''}
        message={confirm.message ?? ''}
        onCancel={() => setConfirm({ visible: false })}
        onConfirm={() => { confirm.onConfirm?.(); setConfirm({ visible: false }) }}
      />
    </Container>
  )
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${Colors.background};
`

const HeaderRow = styled.View`
  margin: 12px 0px 4px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const TabsRow = styled.View`
  margin: 8px 0px 0px;
  flex-direction: row;
`

const TabPill = styled(Pressable)<{ active?: boolean }>`
  padding: 8px 12px;
  border-radius: 999px;
  margin-right: 8px;
  background-color: ${({ active }) => (active ? Colors.accent : Colors.secondary)};
`

const SearchBar = styled.View`
  height: 48px;
  margin: 16px 0px 0px;
  padding: 0 14px;
  border-radius: 12px;
  background-color: ${Colors.secondary};
  flex-direction: row;
  align-items: center;
`

const SortRow = styled.View`
  margin: 12px 0px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const SortButton = styled(Pressable)`
  padding: 6px 10px;
  background-color: ${Colors.secondary};
  border-radius: 8px;
  margin-right: 8px;
`

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`

const SongRow = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  margin-bottom: 14px;
`

const ArtistRow = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  margin-bottom: 16px;
`

const AvatarCircle = styled.View`
  width: 42px;
  height: 42px;
  border-radius: 21px;
  background-color: ${Colors.secondary};
  align-items: center;
  justify-content: center;
`

const MemoryCard = styled.View`
  width: 160px;
  height: 84px;
  border-radius: 12px;
  background-color: ${Colors.secondary};
  padding: 12px;
  margin-right: 12px;
  justify-content: center;
`

const CollectionCard = styled(Pressable)`
  width: 48%;
  background-color: ${Colors.secondary};
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
`

const emptyStyles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { marginTop: 8 },
})

const EmptyState: React.FC<{ title: string; subtitle?: string; onAction?: () => void }> = ({ title, subtitle, onAction }) => (
  <View style={emptyStyles.container}>
    <McText extra size={20} color={themeColors.neonMagenta}>{title}</McText>
    {!!subtitle && (
      <McText color={Colors.grey4} style={emptyStyles.subtitle}>{subtitle}</McText>
    )}
    {!!onAction && (
      <NeonButton style={{ marginTop: 12 }} onPress={onAction} title="Create playlist" />
    )}
  </View>
)

export default Library
