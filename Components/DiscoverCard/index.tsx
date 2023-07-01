import React from 'react'
import { styled } from 'styled-components/native'
import McImage from '../McImage'
import { Text, View } from 'react-native'
import { styles } from './styles'
import { Colors, Images } from '../../Constants'
import McVectorIcon from '../McVectorIcon'
import { DiscoverCardProps } from '../../types'
import McText from '../McText'

const DiscoverCard = ({ cover, title, id, bg }: DiscoverCardProps) => {
    const titleLength = title.length
    return (
        <View key={ id } style={{ 
            paddingHorizontal: 16,
            paddingVertical: 12,
            height:150, 
            justifyContent: 'space-between', 
            marginVertical: 20, 
            marginRight: 24, 
            width: 300, 
            flexDirection: 'row', 
            backgroundColor: bg, 
            borderRadius: 24, 
            position: 'relative' 
        }}>
    
            <View style={{}}>
                <McText style={[titleLength > 10 ? { fontSize: 25 } : { fontSize: 40 }, { maxWidth: 150, flex: 1, textTransform: 'uppercase', flexWrap: 'wrap', letterSpacing: -3, lineHeight: 40 }, bg === Colors.white ? { color: Colors.black } : { color:  Colors.white }]} bold>{ title }</McText>
                <McText bold style={[{ letterSpacing: -1.2 }, bg === Colors.white ? { color: Colors.black } : { color:  Colors.white }]}>Discover 87 songs!</McText>
                <McVectorIcon type='AntDesign' name='swapright' size={30} color={ bg === Colors.white ? Colors.black :Colors.white } />
            </View>
            <McImage source={ cover } style={{ resizeMode: 'cover', width: 140, height: 170, position: 'absolute', right: 5, top: -20, flex: 1, paddingRight: 40 }} />
        </View>
    )
}

export default DiscoverCard

const Container = styled.View`
    flex: 1;
    flex-direction: row;
    border-radius: 16px;
    background-color: white;
    height: 200px;
`
