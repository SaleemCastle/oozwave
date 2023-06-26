import { ImageSourcePropType } from "react-native"

/**
 * Define and export the dummy data.
 */
export const sampleObject1 = {
    id: '001',
    title: 'this is a title',
    desc: 'Do elit pariatur aliqua laborum dolore qui.',
}
export const sampleObject2 = {
    firstName: 'John',
    lastName: 'Doe',
}

export type IDummyPlaylist = {
    id: string
    name: string
    songs: number
    thumbnail: ImageSourcePropType
}
export const Playlists = [
    {
        id: '001',
        name: 'Stargrovers',
        songs: 20,
        thumbnail: require('../assets/images/sample-music-cover.png')
    },
    {
        id: '002',
        name: 'So it goes',
        songs: 5,
        thumbnail: require('../assets/images/sample-music-cover-2.png')
    },
    {
        id: '003',
        name: 'Another 1',
        songs: 1,
        thumbnail: require('../assets/images/sample-music-cover-3.png')
    }
]

export const Favorite = [
    {
        id: '001',
        url: '',
        title: 'Holy (feat. Chance the Rapper)',
        album: 'Great Album',
        artist: 'Justin Bieber',
        thumbnail: require('../assets/images/song-cover.png')  
    },
    {
        id: '002',
        url: '',
        title: 'King & Queen',
        album: 'Imagine Album',
        artist: 'Ava Max',
        thumbnail: require('../assets/images/song-cover.png')  
    },

]

const dummyData = { Playlists, Favorite }

export default dummyData
