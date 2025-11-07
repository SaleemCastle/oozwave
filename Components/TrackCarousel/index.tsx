import React, { useRef } from 'react'
import { View, Image, Dimensions, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native'
import { ITrack } from '../../Store/Actions/currentTrack.actions'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'
import { Images } from '../../Constants'

interface TrackCarouselProps {
    tracks: ITrack[],
    handleNavigationToPlayer: (track: ITrack) => void
}

const { width: screenWidth } = Dimensions.get('window')

const TrackCarousel: React.FC<TrackCarouselProps> = ({ tracks, handleNavigationToPlayer }) => {
    const scrollX = useRef(new Animated.Value(0)).current
    const renderItem = ({ item, index }: { item: ITrack, index: number }) => {
        const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth]

        const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [-screenWidth * 0.08, 0, screenWidth * 0.08],
        })

        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.96, 1, 0.96],
        })

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.0, 1, 0.0],
        })

        return (
            <View style={ styles.page }>
                <Animated.View style={{ ...styles.artworkWrap, transform: [{ translateX }, { scale }], opacity }}>
                    <TouchableWithoutFeedback onPress={() => handleNavigationToPlayer(item)}>
                        <View style={{ borderRadius: 4, overflow: 'hidden' }}>
                            <CoverImage
                                //@ts-ignore
                                src={ item?.path }
                                placeHolder={ Images.DefaultMusicIcon }
                                width={ screenWidth * 0.85 }
                                height={ screenWidth * 0.85 }
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </View>
        )
    }

    return (
        <View style={ styles.container }>
            <Animated.FlatList
                data={ tracks }
                horizontal
                showsHorizontalScrollIndicator={ false }
                pagingEnabled
                keyExtractor={(item) => item.id.toString()}
                renderItem={ renderItem }
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: true,
                })}
                removeClippedSubviews={ false }
                initialNumToRender={ 3 }
                windowSize={ 5 }
                scrollEventThrottle={ 16 }
                decelerationRate='fast'
                snapToAlignment='center'
                contentContainerStyle={ styles.flatListContent }
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        // backgroundColor: 'red',
        justifyContent: 'center'
    },
    flatListContent: {
        alignItems: 'center',
    },
    page: {
        width: screenWidth,
        justifyContent: 'center',
        alignItems: 'center',
    },
    artworkWrap: {
        width: screenWidth * 0.85,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
})

export default TrackCarousel
