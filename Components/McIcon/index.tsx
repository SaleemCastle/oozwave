import styled from 'styled-components/native';
import { Metrics } from '../../Constants';
import { ViewStyle } from 'react-native';

const McIcon = styled.Image<IProps>`
    width: ${ props => props.size || Metrics.images.small }px;
    height: ${ props => props.size || Metrics.images.small }px;
    border-radius: ${( props ) =>
        props.round
        ? props.size
            ? `${ props.size }px`
            : `${ Metrics.images.small }px`
        : `0px`};
`

interface IProps {
    size?: number
    round?: boolean
    source?: { }
    resizeMode?: string
    style?: any
}

export default McIcon;
