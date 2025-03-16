import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { View, Text, ImageSourcePropType, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import styled from 'styled-components';
import LinearGradient from 'react-native-linear-gradient';

import McImage from '../McImage';
import { Colors } from '../../Constants';

const start = { x: 0, y: 0 };
const end = { x: 1, y: 0 };

interface IProps {
    size?: number;
    circle?: number;
    icon?: ImageSourcePropType;
    onPress?: () => void;
}

const defaultIcon = <Icon name="play" size={30} color="#fff" />;

const AnimatedPlayButton = (props: IProps): React.ReactElement => {
    const { size, circle, icon, onPress } = props;

    // Rotation animation refs
    const rotation1 = useRef(new Animated.Value(0)).current;
    const rotation2 = useRef(new Animated.Value(0)).current;
    const rotation3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createRotationAnimation = (animatedValue: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                    delay: delay,
                    useNativeDriver: true,
                })
            );
        };

        const anim1 = createRotationAnimation(rotation1, 0);
        const anim2 = createRotationAnimation(rotation2, 500); // Slight delay
        const anim3 = createRotationAnimation(rotation3, 1000); // More delay

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, [rotation1, rotation2, rotation3]);

    const getRotationStyle = (animatedValue: Animated.Value) => {
        return {
            transform: [
                {
                    rotate: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                    }),
                },
            ],
        };
    };

    return (
        <Container size={size} onPress={onPress}>
            <McImage source={icon ?? (defaultIcon as ImageSourcePropType)} style={{ position: 'relative', zIndex: 1 }} />

            <AnimatedCircle
                colors={Colors.linearGradient1}
                size={size}
                start={start}
                circle={circle}
                end={end}
                style={[
                    {
                        opacity: 0.5,
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                    },
                    getRotationStyle(rotation1),
                ]}
            />
            <AnimatedCircle
                colors={Colors.linearGradient1}
                size={size}
                start={start}
                circle={circle}
                end={end}
                style={[
                    {
                        opacity: 0.5,
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                    },
                    getRotationStyle(rotation2),
                ]}
            />
            <AnimatedCircle
                colors={Colors.linearGradient1}
                size={size}
                start={start}
                circle={circle}
                end={end}
                style={[
                    {
                        opacity: 0.5,
                        position: 'absolute',
                        top: 0,
                    },
                    getRotationStyle(rotation3),
                ]}
            />
        </Container>
    );
};

const Container = styled(TouchableOpacity) <IProps>`
  width: ${props => props.size || 78}px;
  height: ${props => props.size || 78}px;
  justify-content: center;
  align-items: center;
`;

const Circle = styled(LinearGradient) <IProps>`
  width: ${props => props.circle || 70}px;
  height: ${props => props.circle || 70}px;
  border-radius: ${props => (props.circle ? props.circle : 70 / 2 || 70 / 2)}px;
`;

// Wrap Circle in Animated to enable animations
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default AnimatedPlayButton;
