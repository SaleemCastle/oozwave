import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BillboardsProps, IBillboardCardProps } from '../../types'
import { styled } from 'styled-components/native'
import { McText, McVectorIcon } from '../../Components'
import { Colors, Images } from '../../Constants'
import { Dimensions, FlatList, LayoutAnimation, Platform, UIManager, Animated, Easing, View, ImageBackground, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { Billboard } from '../../Mock/Dummy'
import BillboardCard from '../../Components/BillboardCard'
import AnimatedPlayButton from '../../Components/AnimatedPlayButton'
import LinearGradient from 'react-native-linear-gradient'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
const HEADER_HEIGHT = Math.min(Math.max(screenHeight * 0.5, 280), 380)
// Animated wrapper for ImageBackground (Animated doesn't expose ImageBackground by default)
const AnimatedImageBG = Animated.createAnimatedComponent(ImageBackground as any)

const Billboards = ({ route }: BillboardsProps) => {
    const title = (route as any)?.params?.info?.title ?? 'Billboard'
    const [isLoading, setLoading] = useState(false)
    const billboard = JSON.parse(JSON.stringify(Billboard))
    const [items, setItems] = useState<IBillboardCardProps[]>([])
    const [filter, setFilter] = useState<'All' | 'New' | 'Rising' | 'Re-entries'>('All')
    const [sortKey, setSortKey] = useState<'rank' | 'peak' | 'weeks' | 'alpha'>('rank')
    const headerOpacity = useRef(new Animated.Value(0)).current
    const scrollY = useRef(new Animated.Value(0)).current

    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true)
    }

    // const getBillboard = async () => {
    //     try {
    //         setLoading(true)
    //         const res = await fetch(url, {
    //             method: 'GET',
    //         })

    //         const data = await res.json()
    //         console.log('Data ', data)
    //         // setBillboard(data.toptracks)
    //         setLoading(false)
    //     } catch (error) {
    //         console.error(error)
    //         setLoading(false )
    //     }
    // }

    // useEffect(() => {
    //     getBillboard()
    // }, [])

    useEffect(() => {
        const content = billboard?.content ?? {}
        const parsed: IBillboardCardProps[] = Object.values(content).map((raw: any) => {
            const keys = Object.keys(raw)
            const vals = Object.values(raw)
            let acc: any = {}
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i]
                const safeKey = k.includes(' ')
                    ? (k.includes('.') ? k.split('.').join('') : k.split(' ').join('_'))
                    : k
                acc = { ...acc, [safeKey]: vals[i] }
            }
            return acc as IBillboardCardProps
        })
        setItems(parsed)

        Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const trackCount = items.length
    const chartDate = billboard?.info?.date
    const stickyOpacity = scrollY.interpolate({ inputRange: [40, 80], outputRange: [0, 1], extrapolate: 'clamp' })

    const data = React.useMemo(() => {
        let arr = [...items]
        if (filter === 'Rising') {
            arr = arr.filter(it => String((it as any).detail).toLowerCase() === 'up')
        } else if (filter === 'New') {
            arr = arr.filter(it => !it.last_week || String(it.last_week).trim() === '')
        } else if (filter === 'Re-entries') {
            arr = arr.filter(_ => false)
        }
        const num = (v: any) => {
            const n = parseInt(String(v ?? '0').replace(/[^0-9]/g, ''), 10)
            return isNaN(n) ? 0 : n
        }
        if (sortKey === 'rank') arr.sort((a,b) => num(a.rank) - num(b.rank))
        if (sortKey === 'peak') arr.sort((a,b) => num(a.peak_position) - num(b.peak_position))
        if (sortKey === 'weeks') arr.sort((a,b) => num(b.weeks_on_chart) - num(a.weeks_on_chart))
        if (sortKey === 'alpha') arr.sort((a,b) => String(a.title).localeCompare(String(b.title)))
        return arr
    }, [items, filter, sortKey])

    const handleShuffle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        const next = [...items]
        for (let i = next.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[next[i], next[j]] = [next[j], next[i]]
        }
        setItems(next)
    }

    const handlePlayAll = () => {
        // Integrate with player when available
        // For now, provide a lightweight feedback via console
        console.log('Play all from Billboard list')
    }

    const renderHeader = React.useCallback(() => {
        const translateY = scrollY.interpolate({
            inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            outputRange: [-HEADER_HEIGHT * 0.4, 0, HEADER_HEIGHT * 0.3],
            extrapolate: 'clamp',
        })
        const scale = scrollY.interpolate({
            inputRange: [-HEADER_HEIGHT, 0],
            outputRange: [1.15, 1],
            extrapolateRight: 'clamp',
        })
        return (
            <Animated.View style={{ opacity: headerOpacity }}>
                <FullBleed>
                    <AnimatedMusicCoverBackground
                        source={ Images.BillboardCover }
                        imageStyle={{ opacity: 0.95 }}
                        style={{ transform: [{ translateY }, { scale }] }}
                    >
                        <LinearGradient pointerEvents='none' colors={[ 'rgba(0,0,0,0)', Colors.background ]} locations={[0.45, 1]} style={ [StyleSheet.absoluteFillObject, styles.heroGradient] } />
                        <HeaderOverlay>
                            <McText extra size={28} color={Colors.grey5}>{ title }</McText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginTop: 4 }}>
                                    <McVectorIcon type='Feather' name='list' size={14} color={Colors.grey4} />
                                    <McText size={12} color={Colors.grey4} style={{ marginLeft: 6 }}>{ trackCount } tracks</McText>
                                </View>
                                {!!chartDate && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <McVectorIcon type='Feather' name='calendar' size={14} color={Colors.grey4} />
                                        <McText size={12} color={Colors.grey4} style={{ marginLeft: 6 }}>Updated { chartDate }</McText>
                                    </View>
                                )}
                            </View>
                            <ActionsRow style={{ marginTop: 14 }}>
                                <ActionButton onPress={ handlePlayAll } accessibilityLabel='Play all'>
                                    <McVectorIcon type='Feather' name='play' size={16} color={Colors.grey5} />
                                    <McText medium size={13} color={Colors.grey5} style={{ marginLeft: 8 }}>Play all</McText>
                                </ActionButton>
                                <ActionButton onPress={ handleShuffle } style={{ marginLeft: 12 }} accessibilityLabel='Shuffle all'>
                                    <McVectorIcon type='Feather' name='shuffle' size={16} color={Colors.grey5} />
                                    <McText medium size={13} color={Colors.grey5} style={{ marginLeft: 8 }}>Shuffle</McText>
                                </ActionButton>
                            </ActionsRow>
                        </HeaderOverlay>
                    </AnimatedMusicCoverBackground>
                </FullBleed>
            </Animated.View>
        )
    }, [Colors.background, chartDate, headerOpacity, scrollY, title, trackCount])

    const renderItem = React.useCallback(({ item }: { item: IBillboardCardProps }) => (
        <Swipeable
            renderLeftActions={() => (
                <SwipeActionLeft>
                    <McVectorIcon type='Feather' name='skip-forward' size={18} color={Colors.grey5} />
                    <McText size={12} color={Colors.grey5} style={{ marginTop: 4 }}>Queue next</McText>
                </SwipeActionLeft>
            )}
            renderRightActions={() => (
                <SwipeActionRight>
                    <McVectorIcon type='Feather' name='plus' size={18} color={Colors.grey5} />
                    <McText size={12} color={Colors.grey5} style={{ marginTop: 4 }}>Add</McText>
                </SwipeActionRight>
            )}
            overshootLeft={false}
            overshootRight={false}
        >
            <BillboardCard data={ item } onPress={() => {}} onPlayPress={() => {}} />
        </Swipeable>
    ), [])

    return (
        <Container>
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <AnimatedPlayButton icon="long-arrow-alt-right" size={78} circle={70} />
                </View>
            ) : (
                <Animated.FlatList
                    data={ data }
                    keyExtractor={(it, idx) => `${it.rank}_${it.title}_${idx}`}
                    renderItem={ renderItem }
                    ListHeaderComponent={React.useMemo(() => () => (
                        <>
                            { renderHeader() }
                            <FilterRow>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                                    {(['All','New','Rising','Re-entries'] as const).map(key => (
                                        <Chip key={key} active={filter===key} onPress={() => setFilter(key)}>
                                            <McText medium size={12} color={filter===key ? Colors.grey5 : Colors.grey4}>{key}</McText>
                                        </Chip>
                                    ))}
                                    <SortButton onPress={() => setSortKey(prev => prev==='rank'?'peak': prev==='peak'?'weeks': prev==='weeks'?'alpha':'rank')}>
                                        <McVectorIcon type='Feather' name='sliders' size={14} color={Colors.grey4} />
                                        <McText medium size={12} color={Colors.grey4} style={{ marginLeft: 6 }}>Sort: {sortKey}</McText>
                                    </SortButton>
                                </ScrollView>
                            </FilterRow>
                        </>
                    ), [filter, sortKey, renderHeader])}
                    style={{ flex: 1, alignSelf: 'stretch' }}
                    contentContainerStyle={{ paddingBottom: 12, paddingHorizontal: 16 }}
                    showsVerticalScrollIndicator={ false }
                    removeClippedSubviews
                    windowSize={ 7 }
                    initialNumToRender={ 12 }
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                />
            )}
            <StickyBar style={{ opacity: stickyOpacity }}>
                <BarSurface>
                    <ActionsRow>
                        <SmallIconButton onPress={ handlePlayAll } accessibilityLabel='Play all'>
                            <McVectorIcon type='Feather' name='play' size={16} color={Colors.grey5} />
                            <McText medium size={11} color={Colors.grey5} style={{ marginLeft: 6 }}>Play</McText>
                        </SmallIconButton>
                        <SmallIconButton onPress={ handleShuffle } accessibilityLabel='Shuffle all' style={{ marginLeft: 10 }}>
                            <McVectorIcon type='Feather' name='shuffle' size={16} color={Colors.grey5} />
                            <McText medium size={11} color={Colors.grey5} style={{ marginLeft: 6 }}>Shuffle</McText>
                        </SmallIconButton>
                        <SmallIconButton accessibilityLabel='Save chart' style={{ marginLeft: 10 }}>
                            <McVectorIcon type='Feather' name='heart' size={16} color={Colors.grey5} />
                        </SmallIconButton>
                        <SmallIconButton accessibilityLabel='Share chart' style={{ marginLeft: 10 }}>
                            <McVectorIcon type='Feather' name='share-2' size={16} color={Colors.grey5} />
                        </SmallIconButton>
                    </ActionsRow>
                </BarSurface>
            </StickyBar>
        </Container>
    )
}

export default Billboards

const Container = styled.View`
    flex: 1;
    padding: 0px;
    background-color: ${ Colors.background };
    align-items: stretch;
`

const ActionsRow = styled.View`
    flex-direction: row;
    align-items: center;
`

const AnimatedMusicCoverBackground = styled(AnimatedImageBG as any)`
    width: 100%;
    height: ${HEADER_HEIGHT}px;
`

const HeaderOverlay = styled.View`
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: 16px;
    z-index: 2;
`

const ActionButton = styled.TouchableOpacity`
    padding: 10px 16px;
    border-radius: 999px;
    border-width: 1px;
    border-color: rgba(255,255,255,0.18);
    background-color: rgba(0,0,0,0.25);
    flex-direction: row;
    align-items: center;
`

const SwipeAction = styled.View`
    width: 96px;
    justify-content: center;
    align-items: center;
    marginVertical: 6px;
    border-radius: 12px;
`

const SwipeActionLeft = styled(SwipeAction)`
    background-color: rgba(0,200,255,0.18);
    border-right-width: 1px;
    border-color: rgba(255,255,255,0.1);
`

const SwipeActionRight = styled(SwipeAction)`
    background-color: rgba(255,255,255,0.10);
    border-left-width: 1px;
    border-color: rgba(255,255,255,0.1);
`

const FilterRow = styled.View`
    width: 100%;
    padding-top: 6px;
`

const Chip = styled.TouchableOpacity<{ active: boolean }>`
    padding: 8px 12px;
    border-radius: 999px;
    border-width: 1px;
    border-color: ${({ active }) => active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)'};
    background-color: ${({ active }) => active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'};
    margin-right: 10px;
`

const SortButton = styled.TouchableOpacity`
    padding: 8px 12px;
    border-radius: 999px;
    border-width: 1px;
    border-color: rgba(255,255,255,0.12);
    background-color: rgba(12,0,24,0.35);
    flex-direction: row;
    align-items: center;
`

const FullBleed = styled.View`
    margin-left: -16px;
    margin-right: -16px;
`

const styles = StyleSheet.create({
    heroGradient: { zIndex: 1 } as any,
})
const StickyBar = styled(Animated.View)`
    position: absolute;
    left: 0; right: 0; top: 0;
    padding-top: 8px;
`

const BarSurface = styled.View`
    margin: 0 12px;
    padding: 8px 12px;
    border-radius: 999px;
    border-width: 1px;
    border-color: rgba(255,255,255,0.08);
    background-color: rgba(12,0,24,0.45);
`

const SmallIconButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    padding: 8px 12px;
    border-radius: 999px;
    border-width: 1px;
    border-color: rgba(255,255,255,0.12);
    background-color: rgba(255,255,255,0.06);
`
