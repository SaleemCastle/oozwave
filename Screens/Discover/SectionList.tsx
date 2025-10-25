import React, { useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, TextInput, View } from 'react-native'
import styled from 'styled-components/native'

import { Colors } from '../../Constants'
import { McText } from '../../Components'
import { SkeletonCircle, SkeletonRect } from '../../Components/shared/Skeleton'
import { fetchDiscoverSection, PlaylistBrief, ArtistBrief, AlbumBrief, CreatorBrief, ReleaseBrief, GenreBrief } from '../../services/discoverApi'
import { McImage } from '../../Components'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'

type Props = NativeStackScreenProps<RootStackParamList, 'DiscoverSection'>

const DiscoverSection: React.FC<Props> = ({ route, navigation }) => {
  const { kind, title } = route.params
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchDiscoverSection(kind)
      .then((res) => { if (mounted) setData(res as any[]) })
      .catch(() => {})
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [kind])

  const renderItem = ({ item }: any) => {
    if (kind === 'artists') {
      return (
        <Row onPress={() => Alert.alert('Coming soon', 'Top artists browsing will be available soon.') }>
          <AvatarCircle>
            <McText bold size={16} color={Colors.white}>{(item as ArtistBrief).name.slice(0,1).toUpperCase()}</McText>
          </AvatarCircle>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <McText semi size={14} color={Colors.grey5} numberOfLines={1}>{(item as ArtistBrief).name}</McText>
          </View>
        </Row>
      )
    }
    if (kind === 'albums') {
      const album = item as AlbumBrief
      return (
        <Row onPress={() => Alert.alert('Coming soon', 'Top albums will be available soon.') }>
          <McImage source={album.cover} style={{ width: 48, height: 48, borderRadius: 6 }} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <McText semi size={14} color={Colors.grey5} numberOfLines={1}>{album.name}</McText>
            <McText size={12} color={Colors.grey3} numberOfLines={1} style={{ marginTop: 2 }}>{album.artist}</McText>
          </View>
        </Row>
      )
    }
    const pl = item as PlaylistBrief
    return (
      <Row onPress={() => Alert.alert('Coming soon', 'Community playlists will be available soon.') }>
        <McImage source={pl.thumbnail} style={{ width: 48, height: 48, borderRadius: 6 }} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <McText semi size={14} color={Colors.grey5} numberOfLines={1}>{pl.name}</McText>
          <McText size={12} color={Colors.grey3} numberOfLines={1} style={{ marginTop: 2 }}>{pl.tracks} tracks</McText>
        </View>
      </Row>
    )
  }

  return (
    <Container>
      <Header>
        <McText extra size={22} color={Colors.primary}>{title}</McText>
      </Header>
      <SearchBar>
        <TextInput placeholder="Search" placeholderTextColor={Colors.grey3} style={{ flex: 1, color: Colors.grey4 }} />
      </SearchBar>
      <FlatList
        data={loading ? Array.from({ length: 20 }).map((_, i) => ({ id: `sk_${i}` })) : data}
        keyExtractor={(it: any, idx) => (it.id ?? it.artist ?? it.album ?? String(idx))}
        numColumns={ (kind === 'recommended' || kind === 'trending' || kind === 'playlists' || kind === 'releases' || kind === 'genres') ? 2 : 1 }
        columnWrapperStyle={ (kind === 'recommended' || kind === 'trending' || kind === 'playlists' || kind === 'releases' || kind === 'genres') ? { justifyContent: 'space-between' } : undefined }
        contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
        renderItem={({ item, index }: any) => (
          loading ? (
            (kind === 'recommended' || kind === 'trending' || kind === 'playlists' || kind === 'releases' || kind === 'genres') ? (
              <GridCard>
                <SkeletonRect style={{ width: '100%', height: 140, borderRadius: 12 }} />
                <SkeletonRect style={{ width: '70%', height: 12, marginTop: 8 }} />
              </GridCard>
            ) : (
              <Row>
                <SkeletonRect style={{ width: 48, height: 48, borderRadius: 6 }} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <SkeletonRect style={{ width: '60%', height: 12 }} />
                  <SkeletonRect style={{ width: '40%', height: 10, marginTop: 6 }} />
                </View>
              </Row>
            )
          ) : (
            kind === 'artists' ? (
              <Row onPress={() => Alert.alert('Coming soon', 'Top artists browsing will be available soon.') }>
                <AvatarCircle>
                  <McText bold size={16} color={Colors.white}>{(item as ArtistBrief).name.slice(0,1).toUpperCase()}</McText>
                </AvatarCircle>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <McText semi size={14} color={Colors.grey5} numberOfLines={1}>{(item as ArtistBrief).name}</McText>
                </View>
              </Row>
            ) : kind === 'albums' ? (
              <Row onPress={() => Alert.alert('Coming soon', 'Top albums will be available soon.') }>
                <McImage source={(item as AlbumBrief).cover} style={{ width: 48, height: 48, borderRadius: 6 }} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <McText semi size={14} color={Colors.grey5} numberOfLines={1}>{(item as AlbumBrief).name}</McText>
                  <McText size={12} color={Colors.grey3} numberOfLines={1} style={{ marginTop: 2 }}>{(item as AlbumBrief).artist}</McText>
                </View>
              </Row>
            ) : kind === 'genres' ? (
              <GridCard onPress={() => Alert.alert('Coming soon', `Explore ${(item as GenreBrief).name} soon.`)}>
                <Chip><McText medium size={12} color={Colors.grey4}>{(item as GenreBrief).name}</McText></Chip>
              </GridCard>
            ) : (
              <GridCard onPress={() => Alert.alert('Coming soon', 'Community playlists and releases will be available soon.') }>
                <McImage source={ ((item as any).thumbnail || (item as any).cover) } style={{ width: '100%', height: 140, borderRadius: 12 }} />
                <McText semi size={13} color={Colors.grey5} numberOfLines={1} style={{ marginTop: 8 }}>{(item as any).name || (item as any).title}</McText>
              </GridCard>
            )
          )
        )}
        ItemSeparatorComponent={() => <Separator />}
      />
    </Container>
  )
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${Colors.background};
`

const Header = styled.View`
  margin: 12px 24px 0px;
`

const SearchBar = styled.View`
  height: 48px;
  margin: 16px 24px 0px;
  padding: 0 14px;
  border-radius: 12px;
  background-color: ${Colors.secondary};
  flex-direction: row;
  align-items: center;
`

const Row = styled.Pressable`
  flex-direction: row;
  align-items: center;
`

const Separator = styled.View`
  height: 12px;
`

const AvatarCircle = styled.View`
  width: 42px;
  height: 42px;
  border-radius: 21px;
  background-color: ${Colors.secondary};
  align-items: center;
  justify-content: center;
`

const GridCard = styled.Pressable`
  width: 48%;
  margin-bottom: 16px;
`

const Chip = styled.View`
  padding: 10px 14px;
  border-radius: 999px;
  background-color: ${Colors.secondary};
  align-items: center;
  justify-content: center;
`

export default DiscoverSection
