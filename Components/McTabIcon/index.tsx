import React from 'react'
import McIcon from '../McIcon'

const McTabIcon = (props: IProps): React.ReactElement => {
    const { icon, size, color} = props
    return (
        <McIcon
            source={ icon }
            resizeMode="contain"
            style={{
                width: size,
                height: size,
                tintColor: color,
            }}
        />
    )
}


interface IProps {
    icon: number
    color: string
    size: number 
}

export default McTabIcon
