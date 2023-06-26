import React from 'react'
import { View, Text, ImageSourcePropType, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import styled from 'styled-components'
import LinearGradient from 'react-native-linear-gradient'

import McImage from '../McImage'
import { Colors } from '../../Constants'

const start = { x: 0, y: 0 }
const end = { x: 1, y: 0 }

interface IProps {
  size?: number 
  circle?: number
  icon?: ImageSourcePropType
  onPress?: () => void
}

const defaultIcon = <Icon name="play" size={ 30 } color="#fff" />

const PlayButton = (props: IProps): React.ReactElement => {
    const { size, circle, icon, onPress } = props
    return (
        <Container size={ size } onPress={ onPress }>

        <McImage source={ icon ?? defaultIcon as ImageSourcePropType } style={{ position: 'relative', zIndex: 1 }}/>

        <Circle colors={ Colors.linearGradient1 } size={ size }
            start={ start }
            circle={ circle }
            end={ end }
            style={{
            opacity: 0.5,
            position: 'absolute',
            left: 0,
            bottom: 0
            }}
        />
        <Circle colors={ Colors.linearGradient1 } size={ size }
            start={ start }
            circle={ circle }
            end={ end }
            style={{
            opacity: 0.5,
            position: 'absolute',
            right: 0,
            bottom: 0
            }}
        />
        <Circle colors={ Colors.linearGradient1 } size={ size }
            start={ start }
            circle={ circle }
            end={ end }
            style={{
            opacity: 0.5,
            position: 'absolute',
            top: 0,
            }}
        />

        </Container>
    )
}

const Container = styled(TouchableOpacity)<IProps>`
  width: ${props => props.size || 78}px;
  height: ${props => props.size || 78}px;
  justify-content: center;
  align-items: center;
`

const Circle = styled(LinearGradient)<IProps>`
  width: ${props => props.circle || 70}px;
  height: ${props => props.circle || 70}px;
  border-radius: ${props => props.circle ? props.circle : 70 / 2 || 70/2}px;

`

export default PlayButton