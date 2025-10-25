import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Easing, FlatList, ScrollView, TextInput, View } from 'react-native'
import styled from 'styled-components/native'

import { Colors, Images } from '../../Constants'
import { McImage, McText, McVectorIcon } from '../../Components'
import { SkeletonCircle, SkeletonRect } from '../../Components/shared/Skeleton'
import { fetchDiscoverHome, PlaylistBrief, ArtistBrief, AlbumBrief, CreatorBrief, ReleaseBrief, GenreBrief } from '../../services/discoverApi'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'
import { selectAllPlaylists } from '../../state/playlists'

type Props = NativeStackScreenProps<RootStackParamList, 'Discover'>

const Discover: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true)
  const [recommended, setRecommended] = useState<PlaylistBrief[]>([])
  const [trending, setTrending] = useState<PlaylistBrief[]>([])
  const [artists, setArtists] = useState<ArtistBrief[]>([])
  const [albums, setAlbums] = useState<AlbumBrief[]>([])
  const [creators, setCreators] = useState<CreatorBrief[]>([])
  const [releases, setReleases] = useState<ReleaseBrief[]>([])
  const [genres, setGenres] = useState<GenreBrief[]>([])

  useEffect(() => {
    let mounted = true
    fetchDiscoverHome()
      .then((res) => {
        if (!mounted) return
        setRecommended(res.recommendedPlaylists)
        setTrending(res.trendingPlaylists)
        setArtists(res.topArtists)
        setAlbums(res.topAlbums)
        setCreators(res.creators)
        setReleases(res.newReleases)
        setGenres(res.genres)
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header>
          <McText extra size={24} color={Colors.primary}>Discover</McText>
        </Header>
        <SearchBar>
          <McVectorIcon type="Feather" name="search" color={Colors.grey3} size={18} />
          <TextInput placeholder="Search playlists, artists, albums" placeholderTextColor={Colors.grey3} style={{ flex: 1, marginLeft: 8, color: Colors.grey4 }} />
        </SearchBar>

        <Section>
          <RowHeader>
            <McText semi size={16} color={Colors.grey4}>Recommended for you</McText>
            <SeeAll onPress={() => navigation.navigate('DiscoverSection', { kind: 'recommended', title: 'Recommended for you' })}>
              <McText medium size={12} color={Colors.grey4}>See all</McText>
            </SeeAll>
          </RowHeader>
          <FlatList
            data={loading ? Array.from({ length: 6 }).map((_, i) => ({ id: `sk_${i}` })) : recommended}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
            renderItem={({ item }: any) => (
              loading ? (
                <Card>
                  <SkeletonRect style={{ width: 140, height: 140, borderRadius: 12 }} />
                  <SkeletonRect style={{ width: 120, height: 12, marginTop: 8 }} />
                  <SkeletonRect style={{ width: 80, height: 10, marginTop: 6 }} />
                </Card>
              ) : (
                <RevealCard
                  cover={(item as PlaylistBrief).thumbnail}
                  title={(item as PlaylistBrief).name}
                  subtitle={`${(item as PlaylistBrief).tracks} tracks`}
                  actions={[{ icon: 'play', label: 'Play' }, { icon: 'shuffle', label: 'Shuffle' }]}
                  onPress={() => Alert.alert('Coming soon', 'Community playlists will be available soon.')}
                />
              )
            )}
          />
        </Section>

        <Section>
          <RowHeader>
            <McText semi size={16} color={Colors.grey4}>Popular creators</McText>
            <SeeAll onPress={() => navigation.navigate('DiscoverSection', { kind: 'creators', title: 'Popular creators' })}>
              <McText medium size={12} color={Colors.grey4}>See all</McText>
            </SeeAll>
          </RowHeader>
          <FlatList
            data={loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `sk_${i}` })) : creators}
            keyExtractor={(a: any) => a.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
            renderItem={({ item }: any) => (
              loading ? (
                <CircleCard>
                  <SkeletonCircle />
                  <SkeletonRect style={{ width: 90, height: 12, marginTop: 8 }} />
                </CircleCard>
              ) : (
                <CircleCard onPress={() => Alert.alert('Coming soon', 'Creator profiles will be available soon.') }>
                  <AvatarCircle>
                    <McText bold size={16} color={Colors.white}>{(item as CreatorBrief).name.slice(0,1).toUpperCase()}</McText>
                  </AvatarCircle>
                  <McText semi size={12} color={Colors.grey5} numberOfLines={1} style={{ marginTop: 8, maxWidth: 96 }}>{(item as CreatorBrief).name}</McText>
                </CircleCard>
              )
            )}
          />
        </Section>

        <Section>
          <RowHeader>
            <McText semi size={16} color={Colors.grey4}>New releases</McText>
            <SeeAll onPress={() => navigation.navigate('DiscoverSection', { kind: 'releases', title: 'New releases' })}>
              <McText medium size={12} color={Colors.grey4}>See all</McText>
            </SeeAll>
          </RowHeader>
          <FlatList
            data={loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `sk_${i}` })) : releases}
            keyExtractor={(a: any) => a.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
            renderItem={({ item }: any) => (
              loading ? (
                <Card>
                  <SkeletonRect style={{ width: 140, height: 140, borderRadius: 12 }} />
                  <SkeletonRect style={{ width: 120, height: 12, marginTop: 8 }} />
                  <SkeletonRect style={{ width: 80, height: 10, marginTop: 6 }} />
                </Card>
              ) : (
                <RevealCard
                  cover={(item as ReleaseBrief).cover}
                  title={(item as ReleaseBrief).title}
                  subtitle={(item as ReleaseBrief).artist}
                  actions={[{ icon: 'play', label: 'Play' }, { icon: 'plus', label: 'Add' }]}
                  onPress={() => Alert.alert('Coming soon', 'Releases will be playable soon.')}
                />
              )
            )}
          />
        </Section>

        <Section>
          <RowHeader>
            <McText semi size={16} color={Colors.grey4}>Genres</McText>
            <SeeAll onPress={() => navigation.navigate('DiscoverSection', { kind: 'genres', title: 'Genres' })}>
              <McText medium size={12} color={Colors.grey4}>See all</McText>
            </SeeAll>
          </RowHeader>
          <FlatList
            data={loading ? Array.from({ length: 10 }).map((_, i) => ({ id: `sk_${i}` })) : genres}
            keyExtractor={(a: any, idx) => a.id ?? String(idx)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
            renderItem={({ item }: any) => (
              loading ? (
                <Chip><SkeletonRect style={{ width: 60, height: 14, borderRadius: 999 }} /></Chip>
              ) : (
                <Chip onPress={() => Alert.alert('Coming soon', `Explore ${item.name} soon.`)}>
                  <McText medium size={12} color={Colors.grey4}>{item.name}</McText>
                </Chip>
              )
            )}
          />
        </Section>
        <Section>
          <RowHeader>
            <McText semi size={16} color={Colors.grey4}>Trending playlists</McText>
            <SeeAll onPress={() => navigation.navigate('DiscoverSection', { kind: 'trending', title: 'Trending playlists' })}>
              <McText medium size={12} color={Colors.grey4}>See all</McText>
            </SeeAll>
          </RowHeader>
          <FlatList
            data={loading ? Array.from({ length: 6 }).map((_, i) => ({ id: `sk_${i}` })) : trending}
            keyExtractor={(p: any) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
            renderItem={({ item }: any) => (
              loading ? (
                <Card>
                  <SkeletonRect style={{ width: 140, height: 140, borderRadius: 12 }} />
                  <SkeletonRect style={{ width: 120, height: 12, marginTop: 8 }} />
                  <SkeletonRect style={{ width: 80, height: 10, marginTop: 6 }} />
                </Card>
              ) : (
                <TrendingCard
                  item={item as PlaylistBrief}
                  cover={(item as PlaylistBrief).thumbnail}
                  onPress={() => Alert.alert('Coming soon', 'Community playlists will be available soon.')}
                />
              )
            )}
          />
        </Section>

        <Section>
          <RowHeader>
            <McText semi size={16} color={Colors.grey4}>Top artists</McText>
            <SeeAll onPress={() => navigation.navigate('DiscoverSection', { kind: 'artists', title: 'Top artists' })}>
              <McText medium size={12} color={Colors.grey4}>See all</McText>
            </SeeAll>
          </RowHeader>
          <FlatList
            data={loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `sk_${i}` })) : artists}
            keyExtractor={(a) => a.artist}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
            renderItem={({ item }: any) => (
              loading ? (
                <CircleCard>
                  <SkeletonCircle />
                  <SkeletonRect style={{ width: 90, height: 12, marginTop: 8 }} />
                </CircleCard>
              ) : (
                <CircleCard onPress={() => Alert.alert('Coming soon', 'Top artists browsing will be available soon.') }>
                  <AvatarCircle>
                    <McText bold size={16} color={Colors.white}>{(item as ArtistBrief).name.slice(0,1).toUpperCase()}</McText>
                  </AvatarCircle>
                  <McText semi size={12} color={Colors.grey5} numberOfLines={1} style={{ marginTop: 8, maxWidth: 96 }}>{(item as ArtistBrief).name}</McText>
                </CircleCard>
              )
            )}
          />
        </Section>

        <Section>
          <RowHeader>
            <McText semi size={16} color={Colors.grey4}>Top albums</McText>
            <SeeAll onPress={() => navigation.navigate('DiscoverSection', { kind: 'albums', title: 'Top albums' })}>
              <McText medium size={12} color={Colors.grey4}>See all</McText>
            </SeeAll>
          </RowHeader>
          <FlatList
            data={loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `sk_${i}` })) : albums}
            keyExtractor={(a) => a.album}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
            renderItem={({ item }: any) => (
              loading ? (
                <Card>
                  <SkeletonRect style={{ width: 140, height: 140, borderRadius: 12 }} />
                  <SkeletonRect style={{ width: 120, height: 12, marginTop: 8 }} />
                  <SkeletonRect style={{ width: 80, height: 10, marginTop: 6 }} />
                </Card>
              ) : (
                <RevealCard
                  cover={(item as AlbumBrief).cover}
                  title={(item as AlbumBrief).name}
                  subtitle={(item as AlbumBrief).artist}
                  actions={[{ icon: 'play', label: 'Play' }]}
                  onPress={() => Alert.alert('Coming soon', 'Top albums will be available soon.')}
                />
              )
            )}
          />
        </Section>
        <BottomSpace />
      </ScrollView>
    </Container>
  )
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${Colors.background};
`

const Header = styled.View`
  margin: 12px 24px 0px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
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

const Section = styled.View`
  margin-top: 16px;
`

const RowHeader = styled.View`
  margin: 0px 24px 4px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const Card = styled.Pressable`
  margin-right: 14px;
  width: 140px;
`

const Cover = styled.View``

const CircleCard = styled.Pressable`
  margin-right: 16px;
  align-items: center;
  width: 120px;
`

const AvatarCircle = styled.View`
  width: 72px;
  height: 72px;
  border-radius: 36px;
  background-color: ${Colors.secondary};
  align-items: center;
  justify-content: center;
`

const BottomSpace = styled.View`
  height: 120px;
`

const SeeAll = styled.Pressable`
  padding: 6px 10px;
  background-color: ${Colors.secondary};
  border-radius: 8px;
`

const Chip = styled.Pressable`
  padding: 8px 12px;
  border-radius: 999px;
  background-color: ${Colors.secondary};
  margin-right: 10px;
`

export default Discover

const TrendingCard: React.FC<{ item: any; cover?: any; onPress: () => void }> = ({ item, cover, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current
  const onPressIn = () => Animated.timing(scale, { toValue: 0.98, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()
  const onPressOut = () => Animated.timing(scale, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()
  const reveal = () => Animated.timing(overlayOpacity, { toValue: 1, duration: 160, useNativeDriver: true }).start()
  const hide = () => Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start()
  return (
    <Animated.View style={{ transform: [{ scale }], marginRight: 14 }}>
      <Card onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} onLongPress={reveal}>
        <Cover>
          <McImage source={cover} style={{ width: 140, height: 140, borderRadius: 12 }} />
          <AnimatedOverlay style={{ opacity: overlayOpacity }}>
            <SmallIconButton onPress={() => Alert.alert('Coming soon', 'Play will be available soon.') }>
              <McVectorIcon type="Feather" name="play" color={Colors.white} size={14} />
            </SmallIconButton>
            <SmallSpacer />
            <SmallIconButton onPress={() => Alert.alert('Coming soon', 'Shuffle will be available soon.') }>
              <McVectorIcon type="Feather" name="shuffle" color={Colors.white} size={14} />
            </SmallIconButton>
            <SmallSpacer />
            <SmallIconButton onPress={hide}>
              <McVectorIcon type="Feather" name="x" color={Colors.white} size={14} />
            </SmallIconButton>
          </AnimatedOverlay>
        </Cover>
        <McText semi size={13} color={Colors.grey5} numberOfLines={1} style={{ marginTop: 8 }}>{item.name}</McText>
        <McText size={11} color={Colors.grey3} numberOfLines={1} style={{ marginTop: 2 }}>{item.trackIds?.length ?? 0} tracks</McText>
      </Card>
    </Animated.View>
  )
}

const RevealCard: React.FC<{ cover: any; title: string; subtitle?: string; actions: { icon: 'play'|'shuffle'|'plus' }[]; onPress: () => void }> = ({ cover, title, subtitle, actions, onPress }) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current
  const reveal = () => Animated.timing(overlayOpacity, { toValue: 1, duration: 160, useNativeDriver: true }).start()
  const hide = () => Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start()
  return (
    <Card onPress={onPress} onLongPress={reveal}>
      <Cover>
        <McImage source={cover} style={{ width: 140, height: 140, borderRadius: 12 }} />
        <AnimatedOverlay style={{ opacity: overlayOpacity }}>
          {actions.map((a, idx) => (
            <React.Fragment key={idx}>
              <SmallIconButton onPress={() => Alert.alert('Coming soon', `${a.icon === 'plus' ? 'Add' : a.icon.charAt(0).toUpperCase()+a.icon.slice(1)} will be available soon.`)}>
                <McVectorIcon type="Feather" name={a.icon} color={Colors.white} size={14} />
              </SmallIconButton>
              {idx < actions.length - 1 ? <SmallSpacer /> : null}
            </React.Fragment>
          ))}
          <SmallSpacer />
          <SmallIconButton onPress={hide}>
            <McVectorIcon type="Feather" name="x" color={Colors.white} size={14} />
          </SmallIconButton>
        </AnimatedOverlay>
      </Cover>
      <McText semi size={13} color={Colors.grey5} numberOfLines={1} style={{ marginTop: 8 }}>{title}</McText>
      {subtitle ? (
        <McText size={11} color={Colors.grey3} numberOfLines={1} style={{ marginTop: 2 }}>{subtitle}</McText>
      ) : null}
    </Card>
  )
}

const OverlayWrap = styled.View`
  position: absolute;
  right: 6px;
  top: 6px;
  align-items: center;
`

const SmallSpacer = styled.View`
  height: 6px;
`

const SmallIconButton = styled.Pressable`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: rgba(0,0,0,0.35);
  align-items: center;
  justify-content: center;
`

const AnimatedOverlay = Animated.createAnimatedComponent(OverlayWrap)
