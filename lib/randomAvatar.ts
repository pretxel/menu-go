export default function randomAvatar() {
  const avatarStyles = {
    1: 'Circle',
    2: 'Transparent',
  }
  const avatarStyleRandom = Math.floor(
    Math.random() * (Object.keys(avatarStyles).length - 1 + 1) + 1
  )
  const avatarStyle = `avatarStyle=${avatarStyles[avatarStyleRandom]}`

  const topObject = {
    1: 'NoHair',
    2: 'Eyepatch',
    3: 'Hat',
    4: 'Hijab',
    5: 'Turban',
    6: 'WinterHat1',
    7: 'WinterHat2',
    8: 'WinterHat3',
    9: 'WinterHat4',
    10: 'LongHairBigHair',
    11: 'LongHairBob',
    12: 'LongHairBun',
    13: 'LongHairCurly',
    14: 'LongHairCurvy',
    15: 'LongHairDreads',
    16: 'LongHairFrida',
    17: 'LongHairFro',
    18: 'LongHairFroBand',
    19: 'LongHairNotTooLong',
    20: 'LongHairShavedSides',
    21: 'LongHairMiaWallace',
    22: 'LongHairStraight',
    23: 'LongHairStraight2',
    24: 'LongHairStraightStrand',
    25: 'ShortHairDreads01',
    26: 'ShortHairDreads02',
    27: 'ShortHairFrizzle',
    28: 'ShortHairShaggyMullet',
    29: 'ShortHairShortCurly',
    30: 'ShortHairShortFlat',
    31: 'ShortHairShortRound',
    32: 'ShortHairShortWaved',
    33: 'ShortHairSides',
    34: 'ShortHairTheCaesar',
    35: 'ShortHairTheCaesarSidePart',
  }

  const topRandom = Math.floor(
    Math.random() * (Object.keys(topObject).length - 1 + 1) + 1
  )

  const top = `topType=${topObject[topRandom]}`

  const accesoriesObject = {
    1: 'Blank',
    2: 'Kurt',
    3: 'Prescription01',
    4: 'Prescription02',
    5: 'Round',
    6: 'Sunglasses',
    7: 'Wayfarers',
  }

  const accesoriesRandom = Math.floor(
    Math.random() * (Object.keys(accesoriesObject).length - 1 + 1) + 1
  )

  const accesories = `accessoriesType=${accesoriesObject[accesoriesRandom]}`

  const hairColorObject = {
    1: 'Auburn',
    2: 'Black',
    3: 'Blonde',
    4: 'BlondeGolden',
    5: 'Brown',
    6: 'BrownDark',
    7: 'PastelPink',
    8: 'Blue',
    9: 'Platinum',
    10: 'Red',
    11: 'SilverGray',
  }

  const hairColorRandom = Math.floor(
    Math.random() * (Object.keys(hairColorObject).length - 1 + 1) + 1
  )

  const hairColor = `hairColor=${hairColorObject[hairColorRandom]}`

  const facialHairObject = {
    1: 'Blank',
    2: 'BeardMedium',
    3: 'BeardLight',
    4: 'BeardMajestic',
    5: 'MoustacheFancy',
    6: 'MoustacheMagnum',
  }

  const facialHairRandom = Math.floor(
    Math.random() * (Object.keys(facialHairObject).length - 1 + 1) + 1
  )

  const facialHair = `facialHairType=${facialHairObject[facialHairRandom]}`

  const clothesObject = {
    1: 'BlazerShirt',
    2: 'BlazerSweater',
    3: 'CollarSweater',
    4: 'GraphicShirt',
    5: 'Hoodie',
    6: 'Overall',
    7: 'ShirtCrewNeck',
    8: 'ShirtScoopNeck',
    9: 'ShirtVNeck',
  }

  const clothesRandom = Math.floor(
    Math.random() * (Object.keys(clothesObject).length - 1 + 1) + 1
  )

  const clothes = `clotheType=${clothesObject[clothesRandom]}`

  const colorFabricObjects = {
    1: 'Black',
    2: 'Blue01',
    3: 'Blue02',
    4: 'Blue03',
    5: 'Gray01',
    6: 'Gray02',
    7: 'Heather',
    8: 'PastelBlue',
    9: 'PastelGreen',
    10: 'PastelOrange',
    11: 'PastelRed',
    12: 'PastelYellow',
    13: 'Pink',
    14: 'Red',
    15: 'White',
  }

  const colorFabricRandom = Math.floor(
    Math.random() * (Object.keys(colorFabricObjects).length - 1 + 1) + 1
  )

  const colorFabric = `clotheColor=${colorFabricObjects[colorFabricRandom]}`

  const eyesObjects = {
    1: 'Close',
    2: 'Cry',
    3: 'Default',
    4: 'Dizzy',
    5: 'EyeRoll',
    6: 'Happy',
    7: 'Hearts',
    8: 'Side',
    9: 'Squint',
    10: 'Surprised',
    11: 'Wink',
    12: 'WinkWacky',
  }

  const eyesRandom = Math.floor(
    Math.random() * (Object.keys(eyesObjects).length - 1 + 1) + 1
  )

  const eyes = `eyeType=${eyesObjects[eyesRandom]}`

  const eyeBrowObjects = {
    1: 'Angry',
    2: 'AngryNatural',
    3: 'Default',
    4: 'DefaultNatural',
    5: 'FlatNatural',
    6: 'RaisedExcited',
    7: 'RaisedExcitedNatural',
    8: 'SadConcerned',
    9: 'SadConcernedNatural',
    10: 'UnibrowNatural',
    11: 'UpDown',
    12: 'UpDownNatural',
  }

  const mouthObjects = {
    1: 'Concerned',
    2: 'Default',
    3: 'Disbelief',
    4: 'Eating',
    5: 'Grimace',
    6: 'Sad',
    7: 'ScreamOpen',
    8: 'Serious',
    9: 'Smile',
    10: 'Tongue',
    11: 'UpDown',
    12: 'Twinkle',
    13: 'Vomit',
  }

  const mouthRandom = Math.floor(
    Math.random() * (Object.keys(mouthObjects).length - 1 + 1) + 1
  )
  const eyeBrow = `eyebrowType=${eyeBrowObjects[mouthRandom]}`

  const mouth = `mouthType=${mouthObjects[mouthRandom]}`

  const skinObjects = {
    1: 'Tanned',
    2: 'Yellow',
    3: 'Pale',
    4: 'Light',
    5: 'Brown',
    6: 'DarkBrown',
    7: 'Black',
  }

  const skinRandom = Math.floor(
    Math.random() * (Object.keys(skinObjects).length - 1 + 1) + 1
  )

  const skin = `skinColor=${skinObjects[skinRandom]}`

  const avatarImg = `https://avataaars.io/?${avatarStyle}&${top}&${accesories}&${hairColor}&${facialHair}&${clothes}&${colorFabric}&${eyes}&${eyeBrow}&${mouth}&${skin}`
  return avatarImg
}
