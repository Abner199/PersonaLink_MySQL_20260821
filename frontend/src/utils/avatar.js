const STANDALONE_AVATAR_COUNT = 16
const SPRITE_COLUMNS = 5
const SPRITE_ROWS = 3
const SPRITE_CELL_COUNT = SPRITE_COLUMNS * SPRITE_ROWS
const DEFAULT_AVATAR_COUNT = STANDALONE_AVATAR_COUNT + SPRITE_CELL_COUNT * 2

export const isPlaceholderAvatar = (url) => {
  if (!url || typeof url !== 'string') return false

  try {
    return new URL(url, window.location.origin).hostname.toLowerCase() === 'picsum.photos'
  } catch {
    return url.includes('picsum.photos')
  }
}

const hashText = (value) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

const getAvatarSeed = (user = {}) => String(
  user.email || user.id || user.username || user.name || user.profile?.name || 'default-user'
)

const getDefaultAvatarIndex = (user = {}) => {
  const assignedIndex = Number(user.avatarIndex)
  if (Number.isInteger(assignedIndex) && assignedIndex > 0) {
    return (assignedIndex - 1) % DEFAULT_AVATAR_COUNT
  }
  return hashText(getAvatarSeed(user)) % DEFAULT_AVATAR_COUNT
}

const createSpriteStyle = (spriteUrl, cellIndex) => {
  const column = cellIndex % SPRITE_COLUMNS
  const row = Math.floor(cellIndex / SPRITE_COLUMNS)
  return {
    backgroundImage: `url("${spriteUrl}")`,
    backgroundSize: `${SPRITE_COLUMNS * 100}% ${SPRITE_ROWS * 100}%`,
    backgroundPosition: `${column * 25}% ${row * 50}%`
  }
}

export const createDefaultAvatar = (user = {}) => {
  const index = getDefaultAvatarIndex(user)
  if (index < STANDALONE_AVATAR_COUNT) {
    return {
      type: 'image',
      src: `/images/avatars/avatar-${String(index + 1).padStart(2, '0')}.jpg`,
      style: null
    }
  }

  const spriteIndex = index - STANDALONE_AVATAR_COUNT
  const isNatureSprite = spriteIndex < SPRITE_CELL_COUNT
  const cellIndex = isNatureSprite ? spriteIndex : spriteIndex - SPRITE_CELL_COUNT
  const spriteUrl = isNatureSprite
    ? '/images/avatars/nature-sprite.jpg'
    : '/images/avatars/people-sprite.jpg'

  return {
    type: 'sprite',
    src: spriteUrl,
    style: createSpriteStyle(spriteUrl, cellIndex)
  }
}

export const resolveAvatarPresentation = (user = {}, candidateUrl = '') => {
  const avatarUrl = candidateUrl || user.avatar || user.profile?.avatar || ''
  if (avatarUrl && !isPlaceholderAvatar(avatarUrl)) {
    return { type: 'image', src: avatarUrl, style: null }
  }
  return createDefaultAvatar(user)
}

export const resolveAvatarUrl = (user = {}, candidateUrl = '') => {
  const presentation = resolveAvatarPresentation(user, candidateUrl)
  return presentation.type === 'image'
    ? presentation.src
    : `/images/avatars/avatar-${String((getDefaultAvatarIndex(user) % STANDALONE_AVATAR_COUNT) + 1).padStart(2, '0')}.jpg`
}

export const applyAvatarFallback = (event, user = {}) => {
  if (!event?.target) return
  event.target.onerror = null
  event.target.src = resolveAvatarUrl(user)
}
