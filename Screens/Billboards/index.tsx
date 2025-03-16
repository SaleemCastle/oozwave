import React, { useEffect, useState } from 'react'
import { BillboardsProps, IBillboardCardProps, IBillboardProps } from '../../types'
import { styled } from 'styled-components/native'
import { McImage, McText, McVectorIcon } from '../../Components'
import { Colors, Images } from '../../Constants'
import { Dimensions, ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import { Billboard } from '../../Mock/Dummy'
import BillboardCard from '../../Components/BillboardCard'
import LinearGradient from 'react-native-linear-gradient'
import AnimatedPlayButton from '../../Components/AnimatedPlayButton'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

const Billboards = ({ route }: BillboardsProps) => {
    const { info: { title } } = route.params
    const [isLoading, setLoading] = useState(false)
    // const [billboard, setBillboard] = useState<undefined | any>(undefined)
    const billboard = JSON.parse(JSON.stringify(Billboard))
    const url = "https://ws.audioscrobbler.com/2.0?method=artist.gettoptracks&artist=cher&api_key=550c0434f71ec3c548afccd80f020d63&format=json"

    // const getBillboard = async () => {
    //     try {
    //         setLoading(true)
    //         const res = await fetch(url, {
    //             method: 'GET',
    //         })

    //         const data = await res.json()
    //         console.log('Data ', data)
    //         // setBillboard(data.toptracks)
    //         setLoading(false)
    //     } catch (error) {
    //         console.error(error)
    //         setLoading(false )
    //     }
    // }

    // useEffect(() => {
    //     getBillboard()
    // }, [])

    return (
        <Container>
            {
                isLoading
                ?
                <View style={{flex: 1, justifyContent: 'center'}}>
                    <AnimatedPlayButton 
                        size={78} 
                        circle={70}
                        icon={Images.musicIcon}
                    />
                </View>
                :
                <>
                    <MusicCoverBackground source={ Images.BillboardCover } style={{width: screenWidth, height: screenHeight * 0.5, opacity: 0.5}}/>
                    <LinearGradient 
                        style={{position: 'absolute', width: screenWidth, height: screenHeight * 0.2, bottom: screenHeight * 0.5}}
                        colors={['transparent',Colors.background]}
                    />
                    <View style={{backgroundColor: Colors.primary, position: 'relative', borderRadius: 6, paddingLeft: 8, width: screenWidth * 0.65, justifyContent: 'flex-start', alignSelf: 'flex-start', marginBottom: 24, height: 100}}>
                        <View style={{borderRadius: 999, position: 'absolute', right: 48, top: -12, width: 60, height: 60, backgroundColor: Colors.background}} />
                        <View style={{position: 'absolute', right: 0, top: -12, width: 80, height: 60, backgroundColor: Colors.background}} />
                        <McText bold size={ 20 } color={ Colors.white } style={{ marginTop: 8 }}>{ title }</McText>
                    </View>
                    <ScrollView contentContainerStyle={{width: '100%'}} showsVerticalScrollIndicator={false}>
                        {
                            billboard
                            ?
                            Object.values(billboard.content).map((item, index: number) => {
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
                                    <BillboardCard key={index} data={billboardData as IBillboardCardProps} />
                                )
                            })
                            : 
                            <McText>No Data found</McText>
                        }
                    </ScrollView>
                </>
            }
            
        </Container>
    )
}

export default Billboards

const Container = styled.View`
    flex: 1;
    padding: 0px 12px 0 12px;
    background-color: ${ Colors.background };
    align-items: center;
`

const MusicCoverBackground = styled.ImageBackground`
    width: 100%;
    height: 200px;
    background-position: center center;
`

