const ctx = canvas.getContext('2d')
const [w,h] = [canvas.width, canvas.height]
let debug = false
const colorWheel = [[128,255,0], [255,0,0], [0,0,255], [0,255,0]]
const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

function RGBFromXY(x, y) {
  // Note that x,y is normalized to go from -1 to 1
  // This function is basically "what is the color (lighting direction) for this x/y"
  const map = [y * -1, x, y, x * -1] // maps to color wheel
  const lightColors = colorWheel.map((c,i) => c.map(sub => {
      // return (sub * (i == 0 ? 64 : map[i]))
      return (sub /255 * map[i])
    }))
  return [
    ...lightColors.reduce((redux, direction) => {
      return [redux[0] + direction[0], redux[1] + direction[1], redux[2] + direction[2]]
    }, [0,0,0]),
    0] /// alpha is not used
    
    
    /**
     * old:   
     return [
     ...lightColors.reduce((redux, current) => current.map((c,i) => redux[i] + c), [0,0,0]), 
     0] /// alpha is not used
     */
} // no, Math.abs since it should be able to darken

let lastgeneralMultiplier
function modifyPixel(pixel, mappedPixel, lightColors) {
  const moddedPixel = debug ? mappedPixel : pixel 
  const generalMultiplier = mappedPixel.map((c,i) => {
      // This loop gets the normalmap pixel for this location, looks at the normals that should be active via lightcolors, then uses that to set what the multiplier of the subpixel. E.g. if the lighting dir is supposed to be 90% green and 10% red, it ~~multiplies~~ adds that to the pixel.
      
      // return c
      
      if(i == 3) 
        return c / 255 // Don't change alpha
      return c /255 * (lightColors[i]) // c is a subpixel of the normalmap. We don't add, since it would always add that part. (if everything is light, nothing is) The gist of it is that blue * red would be 0.
      
    }).reduce((r,c) => r + c)
    
  return moddedPixel.map((c,i) => {
      // Don't change alpha
      if(i == 3) 
        return c
      
      return c * (generalMultiplier)
    })
}

async function getModifiedPixels(lightColors) {
  await normalMap.decode()
  const o = new OffscreenCanvas(w, h).getContext("2d")
  o.drawImage(normalMap, 0, 0, w, h)
  const pixels = ctx.getImageData(0, 0, w, h)
  const mappedPixels = o.getImageData(0, 0, w, h)
  
  let lastmappedPixel
  for(var i=0;i<pixels.data.length;i+=4) {
    let newPixel = modifyPixel(pixels.data.slice(i, i+4), mappedPixels.data.slice(i, i+4), lightColors)
    lastmappedPixel = newPixel
    
    for(var si=i;si<i+4;si++) {
      pixels.data[si] = newPixel[si-i]
      if(si-i == 3) {
        // pixels.data[si] = 255
      }
    }
  }
  return pixels
}

canvas.addEventListener('click', async e => {
  debug = !debug
  ctx.drawImage(debug ? normalMap : img, 0, 0, w, h)
  const normMapMouse = [(e.offsetX - w/2)*2 / w, (e.offsetY - h/2)*2 / h]
  const lightColors = RGBFromXY(...normMapMouse);
  // console.log(lightColors)
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
  // canvas.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1,1,0.5)`
  // canvas.style.transform = `rotate3d(${normMouse[0]}, ${normMouse[1]}, ${d}, 12deg)`
})

const img = new Image()
img.src = "stone.jpg"
img.addEventListener('load', () => ctx.drawImage(img, 0, 0, w, h))

const normalMap = new Image()
normalMap.src = "stone_normal.jpg"