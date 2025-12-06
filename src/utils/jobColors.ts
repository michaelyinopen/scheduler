// taken from https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/ . removed red, black and white
const colors = [
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#42d4f4',
  '#f032e6',
  '#bfef45',
  '#fabebe',
  '#469990',
  '#e6beff',
  '#9A6324',
  '#fffac8',
  '#800000',
  '#aaffc3',
  '#808000',
  '#ffd8b1',
  '#000075',
  '#a9a9a9',
]

// taken from https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
export function pickTextColor(bgColor: string, lightColor = '#ffffff', darkColor = '#000000'): string {
  const color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor
  const r = parseInt(color.substring(0, 2), 16) // hexToR
  const g = parseInt(color.substring(2, 4), 16) // hexToG
  const b = parseInt(color.substring(4, 6), 16) // hexToB
  const uicolors = [r / 255, g / 255, b / 255]
  const c = uicolors.map((col) => {
    if (col <= 0.03928) {
      return col / 12.92
    }
    return Math.pow((col + 0.055) / 1.055, 2.4)
  })
  const L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2])
  return (L > 0.179) ? darkColor : lightColor
}

function getRandomColor(): string {
  const constters = '0123456789abcdef'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += constters[Math.floor(Math.random() * 16)]
  }
  if (colors.includes(color)) {
    // prevent from getting the exact same color from pre-defiend colors
    color = getRandomColor()
  }
  return color
}

type NewJobColorResult = { color: string, textColor: string }

/**
 * Returns the next pre-defiend color, or cycles to a random color if <=4 color options remaining. 
 * New job's current color can be the last job's color.
 * CurrentColor can be included or not included in excludeColors.
 * */ 
export function getNewJobColor(excludeColors: string[] = [], currentColor?: string): NewJobColorResult {
  const availableColors = colors.filter(c => c === currentColor || !excludeColors.includes(c))
  const currentIndex = currentColor ? availableColors.indexOf(currentColor) : -1

  const noAvailableColors = availableColors.length === 0
  const onlyCurrentColorAvailable = availableColors.length === 1 && currentIndex === 0

  const isLastAvailableColor = currentIndex === availableColors.length - 1
  const isLastOfFourAvailableColors = availableColors.length <= 4 && isLastAvailableColor

  const color = noAvailableColors || onlyCurrentColorAvailable || isLastOfFourAvailableColors
    ? getRandomColor()
    : availableColors[(currentIndex + 1) % availableColors.length]
  const textColor = pickTextColor(color)
  return { color, textColor }
}
