import React from 'react'
import { View, Text } from 'react-native'
import styled from 'styled-components'

import { Colors } from '../../Constants'

interface IProps {
  children: any
}

const BottomBar = (props: IProps) => {
    const { children } = props
    return (
        <Container>
        
        <View style={{
                marginVertical: 7,
                width: '100%', 
                height: 70,
                borderRadius: 70,
                backgroundColor: Colors.secondary,
                overflow: 'hidden'
            }}
        >
            { children }
        </View>
        
        </Container>
    )
}

const Container = styled(View)`
  width: 100%;
  height: 84px;
  border-radius: 84px;
  background-color: transparent;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`

export default BottomBar