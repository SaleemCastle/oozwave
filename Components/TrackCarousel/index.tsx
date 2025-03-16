import React, { useRef } from 'react'
import { View, Image, Dimensions, FlatList, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native'
import { ITrack } from '../../Store/Actions/currentTrack.actions'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'

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
            outputRange: [-screenWidth * 0.15, 0, screenWidth * 0.15],
        })

        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
        })

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
        })

        return (
            <Animated.View style={{ 
                ...styles.trackContainer, 
                transform: [{ translateX }, { scale }], 
                opacity, 
                marginLeft: index === 0 ? 0 : screenWidth * 0.15, 
                marginRight: index === tracks.length - 1 ? 24 : 0 
            }}>
                <View>
                    <TouchableWithoutFeedback onPress={() => handleNavigationToPlayer(item)}>
                        <View style={{ marginVertical: 24, borderRadius: 4, overflow: 'hidden' }}>
                            <CoverImage
                            //@ts-ignore
                                source={ item?.path }
                                placeHolder={ 'https://cdn2.iconfinder.com/data/icons/Qetto___icons_by_ampeross-d4njobq/256/library-music.png' }
                                width={ screenWidth * 0.85 }
                                height={ screenWidth * 0.85 }
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </Animated.View>
        )
    }

    return (
        <View style={ styles.container }>
            <FlatList
                data={ tracks }
                horizontal
                showsHorizontalScrollIndicator={ false }
                pagingEnabled
                keyExtractor={(item) => item.id.toString()}
                renderItem={ renderItem }
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
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
        paddingHorizontal: 24,
    },
    trackContainer: {
        width: screenWidth * 0.85,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'red'
    },
    trackImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
})

export default TrackCarousel
