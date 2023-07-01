import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/native'
import { Metrics } from '../../Constants'
import { ImageStyle, StyleProp } from 'react-native'

const McAvatar = (props: IProps): React.ReactElement => {
  return <Image source={ props.source } size={ props.size } { ...props.rest } />
}

McAvatar.propTypes = {
  source: PropTypes.number.isRequired,
  size: PropTypes.number,
  onPress: PropTypes.func,
}

McAvatar.defaultProps = {
  size: Metrics.images.medium,
}

const Image = styled.Image<IProps>`
  width: ${props => props.size || Metrics.images.medium}px;
  height: ${props => props.size || Metrics.images.medium}px;
  border-radius: ${(props) =>
    props.round
      ? props.size
        ? `${props.size}px`
        : `${Metrics.images.medium}px`
      : `0px`};
`

interface IProps {
  size?: number
  round?: boolean
  source?: number
  rest?: any
  style?: StyleProp<ImageStyle>
}

export default McAvatar
