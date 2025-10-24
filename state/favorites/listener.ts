import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'

import { persistFavoritesToStorage, toggleFavorite, clearFavorites, setAll } from '.'

type RootWithFavorites = {
  favorites: {
    ids: string[]
  }
}

export const favoritesListenerMiddleware = createListenerMiddleware<RootWithFavorites>()

favoritesListenerMiddleware.startListening({
  matcher: isAnyOf(toggleFavorite, clearFavorites, setAll),
  effect: async (action, api) => {
    api.cancelActiveListeners()
    await api.delay(200)
    api.dispatch(persistFavoritesToStorage())
  },
})

export default favoritesListenerMiddleware

