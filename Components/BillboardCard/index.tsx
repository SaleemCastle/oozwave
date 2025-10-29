import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Colors } from '../../Constants'
import McText from '../McText'
import McVectorIcon from '../McVectorIcon'
import { TouchableOpacity, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { IBillboardCardProps } from '../../types'

type Props = {
  data: IBillboardCardProps
  onPress?: () => void
  onPlayPress?: () => void
}

const BillboardCard: React.FC<Props> = ({ data, onPress, onPlayPress }) => {
  const { artist, rank, title, last_week, peak_position, weeks_on_chart } = data
  const lastMove = (last_week || '').toLowerCase()
  const trendIcon = lastMove.includes('up')
    ? { type: 'Feather' as const, name: 'arrow-up-right', color: Colors.success }
    : lastMove.includes('down')
    ? { type: 'Feather' as const, name: 'arrow-down-right', color: Colors.error }
    : { type: 'Feather' as const, name: 'minus', color: Colors.grey3 }
  const rankNum = parseInt((rank as any) ?? '0', 10)
  const isTop3 = rankNum > 0 && rankNum <= 3
  const isTop10 = !isTop3 && rankNum <= 10

  return (
    <Pressable onPress={ onPress } android_ripple={{ color: 'rgba(255,255,255,0.06)' }} accessibilityLabel={`Open ${title} by ${artist}`}
      style={({ pressed }) => [{ width: '100%' }, pressed ? { transform: [{ scale: 0.995 }], opacity: 0.96 } : null]}
    >
      <View style={ styles.card }>
        <View style={ styles.row }>
          <View style={[styles.rankPill, isTop3 ? styles.rankTop3 : isTop10 ? styles.rankTop10 : null]}>
            {isTop3 ? (
              <LinearGradient colors={['rgba(148,77,255,0.9)','rgba(0,140,255,0.9)']} style={ styles.rankGradientFill } />
            ) : null}
            <McText bold size={14} color={Colors.grey5}>
              #{rank}
            </McText>
          </View>

          <View style={ styles.content }>
            <McText semi size={14} color={Colors.grey5} numberOfLines={1}>
              { title }
            </McText>
            <McText size={12} color={'rgba(255,255,255,0.7)'} numberOfLines={1} style={{ marginTop: 2 }}>
              { artist }
            </McText>

            <View style={ styles.metaRow }>
              <View style={ styles.metaItem }>
                <McVectorIcon type={trendIcon.type} name={trendIcon.name as any} size={14} color={trendIcon.color} />
                <McText size={11} color={Colors.grey4} style={{ marginLeft: 6 }}>Last wk: { last_week || '-' }</McText>
              </View>
              <View style={ styles.metaItem }>
                <McVectorIcon type='Feather' name='trending-up' size={14} color={Colors.grey4} />
                <McText size={11} color={Colors.grey4} style={{ marginLeft: 6 }}>Peak #{ peak_position || '-' }</McText>
              </View>
              <View style={ styles.metaItem }>
                <McVectorIcon type='Feather' name='bar-chart-2' size={14} color={Colors.grey4} />
                <McText size={11} color={Colors.grey4} style={{ marginLeft: 6 }}>{ weeks_on_chart } wks</McText>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={ onPlayPress || onPress }
            accessibilityLabel={`Play ${title}`}
            style={ styles.playBtn as ViewStyle }
            activeOpacity={0.85}
          >
            <McVectorIcon type='Ionicons' name='play' size={18} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel={`More for ${title}`} style={[styles.playBtn as ViewStyle, { marginLeft: 8 }]}>
            <McVectorIcon type='Feather' name='more-vertical' size={18} color={Colors.grey4} />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  )
}

export default BillboardCard

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  rankTop3: {
    borderColor: 'rgba(255,255,255,0.24)',
  },
  rankTop10: {
    borderColor: '#00E0FF66',
  },
  rankGradientFill: {
    ...StyleSheet.absoluteFillObject as any,
  },
  content: {
    flex: 1,
    minHeight: 56,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 12,
  },
})
