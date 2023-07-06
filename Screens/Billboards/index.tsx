import React from 'react'
import { BillboardsProps, IBillboardCardProps, IBillboardProps } from '../../types'
import { styled } from 'styled-components/native'
import { McImage, McText, McVectorIcon } from '../../Components'
import { Colors, Images } from '../../Constants'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Billboard } from '../../Mock/Dummy'
import BillboardCard from '../../Components/BillboardCard'

const Billboards = ({ route }: BillboardsProps) => {
    const { info: { title } } = route.params
    const billboard = JSON.parse(JSON.stringify(Billboard))

    return (
        <Container>
            <McText bold size={ 28 } color={ Colors.primary } style={{ marginBottom: 16 }}>{ title }</McText>
            <MusicCoverBackground source={ Images.BillboardCover } style={{width: 400, height: 200, opacity: 0.5}}/>
            <ScrollView contentContainerStyle={{width: '100%'}} showsVerticalScrollIndicator={false}>
                {
                    Object.values(billboard.content).map((item, index) => {
                        const keys = Object.keys(item as object)
                        const vals = Object.values(item as object)
                        const len = keys.length
                        let billboardData = {}
                        let temp = billboardData
                        for(let i = 0; i < len; i++) {
                            const key = keys[i].split(' ').length > 1 ? keys[i].split(' ').join('_').includes('.') ? keys[i].split('.').join('') : keys[i].split(' ').join('_') : keys[i]
                            const val = vals[i]
                            billboardData = {...temp, [key]: val}
                            temp = billboardData
                        }
                        return (
                            <BillboardCard key={ index } data={ billboardData as IBillboardCardProps }/>
                        )
                    })
                }
            </ScrollView>
            
        </Container>
    )
}

export default Billboards

const Container = styled.View`
    flex: 1;
    padding: 24px 12px 0 12px;
    background-color: ${ Colors.background };
    align-items: center;
`

const MusicCoverBackground = styled.ImageBackground`
    width: 100%;
    height: 200px;
    background-position: center center;
    /* background: coral; */
`

