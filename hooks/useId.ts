import { useRef } from 'react'

import { generateId } from '../state/playlists/utils'

const useId = (prefix?: string) => {
    const idRef = useRef<string>()
    if (!idRef.current) {
        const id = generateId()
        idRef.current = prefix ? `${prefix}-${id}` : id
    }
    return idRef.current
}

export default useId
