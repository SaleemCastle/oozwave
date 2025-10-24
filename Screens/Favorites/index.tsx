import React, { useMemo, useState, useCallback } from 'react'
import { Alert, FlatList, Pressable, TextInput, View } from 'react-native'
import styled from 'styled-components/native'

import { Colors, Images } from '../../Constants'
import { McText, McVectorIcon, NeonButton } from '../../Components'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { selectFavoriteTracks, toggleFavorite } from '../../state/favorites'
import { ITrack } from '../../Store/Actions/currentTrack.actions'
import { playTracksNow } from '../../state/playerQueue'
import { trackToQueueItem } from '../../state/playerQueue/utils'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'

const Favorites: React.FC = () => {
  const dispatch = useAppDispatch()
  const favorites = useAppSelector(selectFavoriteTracks)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'recent' | 'alpha' | 'artist'>('recent')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = favorites
    const filtered = q
      ? base.filter((t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q))
      : base
    switch (sort) {
      case 'alpha':
        return filtered.slice().sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
      case 'artist':
        return filtered.slice().sort((a, b) => (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' }))
      case 'recent':
      default:
        return filtered
    }
  }, [favorites, query, sort])

  const handlePlayAll = useCallback(() => {
    const items = filtered.map(trackToQueueItem).filter(Boolean) as any[]
    if (!items.length) {
      Alert.alert('Nothing to play', 'No playable favorites found.')
      return
    }
    dispatch(playTracksNow(items))
  }, [dispatch, filtered])

  const handleToggleFavorite = useCallback((track: ITrack) => {
    dispatch(toggleFavorite(String(track.id)))
  }, [dispatch])

  const renderHeader = () => (
    <View>
      <HeaderRow>
        <McText extra size={22} color={Colors.primary}>Favorites</McText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <NeonButton circular size={44} onPress={handlePlayAll} icon={<McVectorIcon type="Feather" name="play" color={Colors.white} size={20} />} />
        </View>
      </HeaderRow>
      <SearchBar>
        <McVectorIcon type="Feather" name="search" color={Colors.grey3} size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search favorites"
          placeholderTextColor={Colors.grey3}
          style={{ flex: 1, marginLeft: 8, color: Colors.grey4 }}
        />
        <Pressable onPress={() => setSort((s) => s === 'recent' ? 'alpha' : s === 'alpha' ? 'artist' : 'recent')}>
          <McText medium size={11} color={Colors.grey3}>Sort: {sort}</McText>
        </Pressable>
      </SearchBar>
    </View>
  )

  const renderItem = ({ item }: { item: ITrack }) => (
    <SongRow onPress={() => { const qi = trackToQueueItem(item); if (qi) dispatch(playTracksNow([qi])) }}>
      <CoverImage //@ts-ignore
        src={item.path}
        placeHolder={Images.DefaultMusicIcon as any}
        width={48}
        height={48}
        style={{ borderRadius: 2 }}
      />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <McText semi size={14} color={Colors.white} numberOfLines={1}>{item.title || 'Unknown'}</McText>
        <McText size={12} color={Colors.grey3} numberOfLines={1}>
          {item.artist || 'Unknown'} • {item.album || 'Unknown'}
        </McText>
      </View>
      <Pressable onPress={() => handleToggleFavorite(item)} hitSlop={12}>
        <McVectorIcon type="Feather" name="heart" color={Colors.accent} size={18} />
      </Pressable>
    </SongRow>
  )

  return (
    <Container>
      <FlatList
        data={filtered}
        keyExtractor={(t) => String(t.id)}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState title="No favorites yet" subtitle="Double-tap artwork or tap hearts to like tracks." />}
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

const SearchBar = styled.View`
  height: 48px;
  margin: 16px 0px 0px;
  padding: 0 14px;
  border-radius: 12px;
  background-color: ${Colors.secondary};
  flex-direction: row;
  align-items: center;
`

const SongRow = styled.Pressable`
  flex-direction: row;
  align-items: center;
  margin-top: 14px;
`

const EmptyState: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <View style={{ padding: 24, alignItems: 'center' }}>
    <McText extra size={20} color={Colors.accent}>{title}</McText>
    {!!subtitle && (
      <McText color={Colors.grey4} style={{ marginTop: 8 }}>{subtitle}</McText>
    )}
  </View>
)

export default Favorites
