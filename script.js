const ctx = canvas.getContext('2d')
const [w,h] = [canvas.width, canvas.height]
let debug = false
let clicked = []
// const colorWheel = [[128,255,128], [255,0,128], [128,0,128], [0,128,128]]
// const colorWheel = [[0,255,128], [255,0,128], [0,0,255], [0,255,128]]
const colorWheel = [[0,255,0], [255,0,0], [0,0,255], [0,255,0]]//original
const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

function RGBFromXY(x, y) {
  // Note that x,y is normalized to go from -1 to 1
  // This function is basically "what is the color (lighting direction) for this x/y"
  const modifier = 1
  const lightDirStrength = [y * -1 * modifier, x * modifier, y * modifier, x * -1 * modifier] // maps to color wheel
  const lightColors = colorWheel.map((c,i) => c.map(sub => {
    let sign = Math.sign(lightDirStrength[i])
    return (sub /255 ) * lightDirStrength[i] // original
    // return (sub /128 ) * Math.sqrt(Math.sqrt(Math.abs(lightDirStrength[i]))) * sign
    // return (sub /255 ) * (Math.sign(lightDirStrength[i]) == 1 ? Math.min(lightDirStrength[i], -0.5) : Math.max(lightDirStrength[i], 0.5))
    // return Math.max((sub /255 * lightDirStrength[i]), Math.min(sub /255 * 0.5 * lightDirStrength[i]))
  }))
  return [
    ...lightColors.reduce((redux, direction) => {
      return [redux[0] + direction[0], redux[1] + direction[1], redux[2] + direction[2]]
    }, [0,0,0]),
    0 /// TODO: *why* is this used?
  ]
}

let lastgeneralMultiplier
function modifyPixel(pixel, mappedPixel, lightColors) {
  const targetPixel = debug ? mappedPixel : pixel 
  
  const generalMultiplier = mappedPixel.slice(0,3).map((c,i) => {
    // mapping through the normal-map
    return c * (lightColors[i])
  }).reduce((r,c) => r + c)
  
  return targetPixel.map((c,i) => {
    if(i >= 3) {
      return 255
    }
    return c * (generalMultiplier+32)/255
    return c * ((Math.max(generalMultiplier), 64) /255)
  })
}

async function getModifiedPixels(lightColors) {
  await normalMap.decode()
  const o = new OffscreenCanvas(w, h).getContext("2d")
  o.drawImage(normalMap, 0, 0, w, h)
  const pixels = ctx.getImageData(0, 0, w, h)
  const mappedPixels = o.getImageData(0, 0, w, h)
  
  for(var i=0;i<pixels.data.length;i+=4) {
    let newPixel = modifyPixel(pixels.data.slice(i, i+4), mappedPixels.data.slice(i, i+4), lightColors)
    // if(i == 5000) {
    //   console.log(mappedPixels.data.slice(i, i+4), newPixel)
    // }
 
    for(var si=i;si<i+4;si++) {
      pixels.data[si] = newPixel[si-i]
      // if(si-i == 3) {
      //   pixels.data[si] = 255
      // }
    }
  }
  return pixels
}

canvas.addEventListener('click', async e => {
  debug = !debug
  clicked = [(e.offsetX - w/2)*2 / w, (e.offsetY - h/2)*2 / h]
  ctx.drawImage(debug ? normalMap : img, 0, 0, w, h)
  const normMapMouse = [(e.offsetX - w/2)*2 / w, (e.offsetY - h/2)*2 / h]
  const lightColors = RGBFromXY(...normMapMouse);
  console.log(lastgeneralMultiplier)
})
canvas.addEventListener('mouseout', async e => {
  canvas.style.transform = `none`
  ctx.drawImage(debug ? normalMap : img, 0, 0, w, h)
})
canvas.addEventListener('mousemove', async e => {
  ctx.drawImage(debug ? normalMap : img, 0, 0, w, h)
  const normMouse = [(e.offsetX ) / w, (e.offsetY ) / h]
  const normMapMouse = [(e.offsetX - w/2)*2 / w, (e.offsetY - h/2)*2 / h]
  const lightColors = RGBFromXY(...normMapMouse);
  const modifiedPixels = await getModifiedPixels(lightColors)
  ctx.putImageData(modifiedPixels, 0, 0)
  // console.log(lightColors, lastgeneralMultiplier)
  
  const [rotateX, rotateY] = [
    -22.5 + (normMouse[1] * 45),
    22.5 - (normMouse[0] * 45),
  ]
  canvas.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1,1,0.5)`
})
canvas.addEventListener('touchmove', async e => {
  ctx.drawImage(debug ? normalMap : img, 0, 0, w, h)
  const normMouse = [(e.offsetX ) / w, (e.offsetY ) / h]
  const normMapMouse = [(e.offsetX - w/2)*2 / w, (e.offsetY - h/2)*2 / h]
  const lightColors = RGBFromXY(...normMapMouse);
  const modifiedPixels = await getModifiedPixels(lightColors)
  ctx.putImageData(modifiedPixels, 0, 0)
  // console.log(lightColors, lastgeneralMultiplier)
  
  const [rotateX, rotateY] = [
    -22.5 + (normMouse[1] * 45),
    22.5 - (normMouse[0] * 45),
  ]
  canvas.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1,1,0.5)`
})

const img = new Image()
img.src = "stone.jpg"
img.addEventListener('load', () => ctx.drawImage(img, 0, 0, w, h))

const normalMap = new Image()
normalMap.src = "stone_normal.jpg"