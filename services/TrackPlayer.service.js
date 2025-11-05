/**
 * This is the code that will run tied to the player.
 *
 * The code here might keep running in the background.
 *
 * You should put everything here that should be tied to the playback but not the UI
 * such as processing media buttons or analytics
 */

import TrackPlayer from 'react-native-track-player'

module.exports = async function() {

    TrackPlayer.addEventListener('remote-play', () => {
        TrackPlayer.play()
    })

    TrackPlayer.addEventListener('remote-pause', () => {
        TrackPlayer.pause()
    });

    TrackPlayer.addEventListener('remote-next', () => {
        TrackPlayer.skipToNext()
    });

    TrackPlayer.addEventListener('remote-previous', () => {
        TrackPlayer.skipToPrevious()
    });

    TrackPlayer.addEventListener('remote-stop', () => {
        TrackPlayer.destroy()
    });

    // Seek/jump controls from notification/lock screen
    TrackPlayer.addEventListener('remote-jump-forward', async ({ interval }) => {
        try {
            const pos = await TrackPlayer.getPosition()
            await TrackPlayer.seekTo(pos + (interval || 15))
        } catch {}
    })

    TrackPlayer.addEventListener('remote-jump-backward', async ({ interval }) => {
        try {
            const pos = await TrackPlayer.getPosition()
            await TrackPlayer.seekTo(Math.max(0, pos - (interval || 15)))
        } catch {}
    })

    TrackPlayer.addEventListener('remote-seek', async ({ position }) => {
        try {
            await TrackPlayer.seekTo(position)
        } catch {}
    })

};
