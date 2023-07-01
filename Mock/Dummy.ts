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

export const Billboard = {
    "info": {
        "category": "Billboard",
        "chart": "HOT 100",
        "date": "2023-07-01",
        "source": "Billboard-API"
    },
    "content": {
        "1": {
            "rank": "1",
            "title": "Last Night",
            "artist": "Morgan Wallen",
            "weeks at no.1": "9",
            "last week": "1",
            "peak position": "1",
            "weeks on chart": "21",
            "detail": "same"
        },
        "2": {
            "rank": "2",
            "title": "Fast Car",
            "artist": "Luke Combs",
            "last week": "3",
            "peak position": "2",
            "weeks on chart": "13",
            "detail": "up"
        },
        "3": {
            "rank": "3",
            "title": "Calm Down",
            "artist": "Rema & Selena Gomez",
            "last week": "4",
            "peak position": "3",
            "weeks on chart": "42",
            "detail": "up"
        },
        "4": {
            "rank": "4",
            "title": "Flowers",
            "artist": "Miley Cyrus",
            "last week": "2",
            "peak position": "1",
            "weeks on chart": "23",
            "detail": "down"
        },
        "5": {
            "rank": "5",
            "title": "All My Life",
            "artist": "Lil Durk Featuring J. Cole",
            "last week": "5",
            "peak position": "2",
            "weeks on chart": "6",
            "detail": "same"
        },
        "6": {
            "rank": "6",
            "title": "Favorite Song",
            "artist": "Toosii",
            "last week": "6",
            "peak position": "5",
            "weeks on chart": "18",
            "detail": "same"
        },
        "7": {
            "rank": "7",
            "title": "Karma",
            "artist": "Taylor Swift Featuring Ice Spice",
            "last week": "9",
            "peak position": "2",
            "weeks on chart": "15",
            "detail": "up"
        },
        "8": {
            "rank": "8",
            "title": "Kill Bill",
            "artist": "SZA",
            "last week": "7",
            "peak position": "1",
            "weeks on chart": "28",
            "detail": "down"
        },
        "9": {
            "rank": "9",
            "title": "Creepin'",
            "artist": "Metro Boomin, The Weeknd & 21 Savage",
            "last week": "8",
            "peak position": "3",
            "weeks on chart": "29",
            "detail": "down"
        },
        "10": {
            "rank": "10",
            "title": "Ella Baila Sola",
            "artist": "Eslabon Armado X Peso Pluma",
            "last week": "10",
            "peak position": "4",
            "weeks on chart": "14",
            "detail": "same"
        }
    }
}

const dummyData = { Playlists, Favorite }

export default dummyData
