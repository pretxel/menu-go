export default function randomAvatar() {
  const avatarStyles = ['Circle', 'Transparent']
  const avatarStyleRandom = Math.floor(
    Math.random() * (Object.keys(avatarStyles).length - 1 + 1) + 1
  )
  const avatarStyle = `avatarStyle=${
    avatarStyles[avatarStyleRandom] !== undefined
      ? avatarStyles[avatarStyleRandom]
      : 'Transparent'
  }`
  const topObject = [
    'NoHair',
    'Eyepatch',
    'Hat',
    'Hijab',
    'Turban',
    'WinterHat1',
    'WinterHat2',
    'WinterHat3',
    'WinterHat4',
    'LongHairBigHair',
    'LongHairBob',
    'LongHairBun',
    'LongHairCurly',
    'LongHairCurvy',
    'LongHairDreads',
    'LongHairFrida',
    'LongHairFro',
    'LongHairFroBand',
    'LongHairNotTooLong',
    'LongHairShavedSides',
    'LongHairMiaWallace',
    'LongHairStraight',
    'LongHairStraight2',
    'LongHairStraightStrand',
    'ShortHairDreads01',
    'ShortHairDreads02',
    'ShortHairFrizzle',
    'ShortHairShaggyMullet',
    'ShortHairShortCurly',
    'ShortHairShortFlat',
    'ShortHairShortRound',
    'ShortHairShortWaved',
    'ShortHairSides',
    'ShortHairTheCaesar',
    'ShortHairTheCaesarSidePart',
  ]

  const topRandom = Math.floor(
    Math.random() * (Object.keys(topObject).length - 1 + 1) + 1
  )

  const top = `topType=${
    topObject[topRandom] !== undefined ? topObject[topRandom] : 'NoHair'
  }`

  const accesoriesObject = [
    'Blank',
    'Kurt',
    'Prescription01',
    'Prescription02',
    'Round',
    'Sunglasses',
    'Wayfarers',
  ]

  const accesoriesRandom = Math.floor(
    Math.random() * (Object.keys(accesoriesObject).length - 1 + 1) + 1
  )

  const accesories = `accessoriesType=${
    accesoriesObject[accesoriesRandom] !== undefined
      ? accesoriesObject[accesoriesRandom]
      : 'Blank'
  }`

  const hairColorObject = [
    'Auburn',
    'Black',
    'Blonde',
    'BlondeGolden',
    'Brown',
    'BrownDark',
    'PastelPink',
    'Blue',
    'Platinum',
    'Red',
    'SilverGray',
  ]

  const hairColorRandom = Math.floor(
    Math.random() * (Object.keys(hairColorObject).length - 1 + 1) + 1
  )

  const hairColor = `hairColor=${
    hairColorObject[hairColorRandom] !== undefined
      ? hairColorObject[hairColorRandom]
      : 'Auburn'
  }`

  const facialHairObject = [
    'Blank',
    'BeardMedium',
    'BeardLight',
    'BeardMajestic',
    'MoustacheFancy',
    'MoustacheMagnum',
  ]

  const facialHairRandom = Math.floor(
    Math.random() * (Object.keys(facialHairObject).length - 1 + 1) + 1
  )

  const facialHair = `facialHairType=${
    facialHairObject[facialHairRandom] !== undefined
      ? facialHairObject[facialHairRandom]
      : 'Blank'
  }`

  const clothesObject = [
    'BlazerShirt',
    'BlazerSweater',
    'CollarSweater',
    'GraphicShirt',
    'Hoodie',
    'Overall',
    'ShirtCrewNeck',
    'ShirtScoopNeck',
    'ShirtVNeck',
  ]

  const clothesRandom = Math.floor(
    Math.random() * (Object.keys(clothesObject).length - 1 + 1) + 1
  )

  const clothes = `clotheType=${
    clothesObject[clothesRandom] !== undefined
      ? clothesObject[clothesRandom]
      : 'BlazerShirt'
  }`

  const colorFabricObjects = [
    'Black',
    'Blue01',
    'Blue02',
    'Blue03',
    'Gray01',
    'Gray02',
    'Heather',
    'PastelBlue',
    'PastelGreen',
    'PastelOrange',
    'PastelRed',
    'PastelYellow',
    'Pink',
    'Red',
    'White',
  ]

  const colorFabricRandom = Math.floor(
    Math.random() * (Object.keys(colorFabricObjects).length - 1 + 1) + 1
  )

  const colorFabric = `clotheColor=${
    colorFabricObjects[colorFabricRandom] !== undefined
      ? colorFabricObjects[colorFabricRandom]
      : 'Black'
  }`

  const eyesObjects = [
    'Close',
    'Cry',
    'Default',
    'Dizzy',
    'EyeRoll',
    'Happy',
    'Hearts',
    'Side',
    'Squint',
    'Surprised',
    'Wink',
    'WinkWacky',
  ]

  const eyesRandom = Math.floor(
    Math.random() * (Object.keys(eyesObjects).length - 1 + 1) + 1
  )

  const eyes = `eyeType=${
    eyesObjects[eyesRandom] !== undefined ? eyesObjects[eyesRandom] : 'Close'
  }`

  const eyeBrowObjects = [
    'Angry',
    'AngryNatural',
    'Default',
    'DefaultNatural',
    'FlatNatural',
    'RaisedExcited',
    'RaisedExcitedNatural',
    'SadConcerned',
    'SadConcernedNatural',
    'UnibrowNatural',
    'UpDown',
    'UpDownNatural',
  ]

  const mouthObjects = [
    'Concerned',
    'Default',
    'Disbelief',
    'Eating',
    'Grimace',
    'Sad',
    'ScreamOpen',
    'Serious',
    'Smile',
    'Tongue',
    'UpDown',
    'Twinkle',
    'Vomit',
  ]

  const mouthRandom = Math.floor(
    Math.random() * (Object.keys(mouthObjects).length - 1 + 1) + 1
  )
  const eyeBrow = `eyebrowType=${
    eyeBrowObjects[mouthRandom] !== undefined
      ? eyeBrowObjects[mouthRandom]
      : 'Angry'
  }`

  const mouth = `mouthType=${
    mouthObjects[mouthRandom] !== undefined
      ? mouthObjects[mouthRandom]
      : 'Concerned'
  }`

  const skinObjects = [
    'Tanned',
    'Yellow',
    'Pale',
    'Light',
    'Brown',
    'DarkBrown',
    'Black',
  ]

  const skinRandom = Math.floor(
    Math.random() * (Object.keys(skinObjects).length - 1 + 1) + 1
  )

  const skin = `skinColor=${
    skinObjects[skinRandom] !== undefined ? skinObjects[skinRandom] : 'Tanned'
  }`

  const avatarImg = `https://avataaars.io/?${avatarStyle}&${top}&${accesories}&${hairColor}&${facialHair}&${clothes}&${colorFabric}&${eyes}&${eyeBrow}&${mouth}&${skin}`
  return avatarImg
}
