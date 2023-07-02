import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Colors, Images } from '../../Constants'
import McImage from '../McImage'
import McText from '../McText'
import McVectorIcon from '../McVectorIcon'
import { IBillboardCardProps } from '../../types'

interface IProps {
    data: IBillboardCardProps
}

const BillboardCard = (props: IProps) => {
    const { artist, rank, title, last_week } = props.data
    return (
        <View style={ styles.bCardContainer }>
            <View style={ styles.itemDetailContainer }>
                <McText bold color={ Colors.white } size={ 32 }>{ rank }</McText>
                <View style={ styles.image }>
                    {/* <McImage source={ Images.songCover } style={{width: undefined, height: undefined, ...StyleSheet.absoluteFillObject}} resizeMode='cover'/> */}
                    <McVectorIcon type='Entypo' name='vinyl' size={52} color={ Colors.white }/>
                </View>
                <View style={{justifyContent: 'space-around'}}>
                    <McText size={12} style={ styles.text }>{ title }</McText>
                    <McText size={12} style={ styles.text } color={ Colors.white }>{ artist }</McText>
                    <McText size={10} style={{fontFamily: 'GentiumBookBasic-Italic', marginTop: 6}} color={ Colors.white }>{`Last Week: ${last_week}`}</McText>
                </View>
            </View>
            {/* <McImage source={ Images.play }/> */}
            <View style={{flex: 1}}>
                <McVectorIcon type='Ionicons' name='play' size={30} color={ Colors.white } />
            </View>
        </View>
    )
}

export default BillboardCard

const styles = StyleSheet.create({
    bCardContainer: {
        width: '100%',
        backgroundColor: '#2e2245', 
        height: 70, 
        borderRadius: 12, 
        flexDirection: 'row', 
        paddingHorizontal: 16, 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12 
    },

    itemDetailContainer: { 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        flexDirection: 'row', 
        gap: 16,
        flex: 9,
        overflow: 'hidden'
    },
    image: {
        position: 'relative', 
        height: 52, 
        width: 52
    },
    text: {
        letterSpacing: 1.15, 
        lineHeight: 14, 
        color: Colors.white
    }
})
