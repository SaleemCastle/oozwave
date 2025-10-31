import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, ImageSourcePropType, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import styled from 'styled-components'
import LinearGradient from 'react-native-linear-gradient'

import McImage from '../McImage'
import { Colors } from '../../Constants'

const start = { x: 0, y: 0 }
const end = { x: 1, y: 0 }

interface IProps {
  size?: number 
  circle?: number
  icon?: string
  iconSize?: number
  onPress?: () => void
}

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient)

const PlayButton = (props: IProps): React.ReactElement => {
    const { size, circle, icon, onPress, iconSize } = props
    const pulseValues = useRef([0, 1, 2].map(() => new Animated.Value(0))).current

    useEffect(() => {
        const animations = pulseValues.map((value, index) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(index * 120),
                    Animated.timing(value, {
                        toValue: 1,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                    Animated.timing(value, {
                        toValue: 0,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                ]),
            ),
        )

        animations.forEach(animation => animation.start())

        return () => {
            animations.forEach(animation => animation.stop())
        }
    }, [pulseValues])

    const circleStyles = useMemo(
        () => [
            { style: { opacity: 0.5, position: 'absolute', left: 0, bottom: 0 } },
            { style: { opacity: 0.5, position: 'absolute', right: 0, bottom: 0 } },
            { style: { opacity: 0.5, position: 'absolute', top: 0 } },
        ],
        [],
    )

    return (
        <Container size={ size } onPress={ onPress }>
            {
                icon
                    ? <Icon name={icon} size={ iconSize ?? 30 } color="#fff" style={{ position: 'relative', zIndex: 1 }}/>
                    : null
            }
            {
                circleStyles.map(({ style }, index) => {
                    const scale = pulseValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.08],
                    })

                    return (
                        <Circle
                            key={ index }
                            colors={ Colors.linearGradient1 }
                            size={ size }
                            circle={ circle }
                            start={ start }
                            end={ end }
                            style={ [
                                style,
                                {
                                    transform: [{ scale }],
                                },
                            ] }
                        />
                    )
                })
            }
        </Container>
    )
}

const Container = styled(TouchableOpacity)<IProps>`
  width: ${props => props.size || 78}px;
  height: ${props => props.size || 78}px;
  justify-content: center;
  align-items: center;
`

const Circle = styled(AnimatedGradient)<IProps>`
  width: ${props => props.circle || 70}px;
  height: ${props => props.circle || 70}px;
  border-radius: ${props => props.circle ? props.circle : 70 / 2 || 70/2}px;
`

export default PlayButton
