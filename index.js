var Simplex = require('perlin-simplex')
var Delaunator = require('delaunator')
var getDistance = require('euclidean-distance')

var simplex = new Simplex()

var SPEED = 2.75
var N_POINTS = 120

var width = 0.75 * window.innerWidth
var height = 0.75 * window.innerHeight

document.body.style.background = 'rgb(20, 20, 20)'

var points = createPoints(N_POINTS, width, height)

points.forEach(function (point) {
  // document.body.appendChild(point.el)
})

var parent = document.createElement('div')
parent.style.position = 'absolute'
parent.style.top = 0.125 * window.innerHeight + 'px'
parent.style.left = 0.125 * window.innerWidth + 'px'
document.body.appendChild(parent)
var triangles = createTrianges(points)
parent.appendChild(triangles.el)

window.requestAnimationFrame(updateLoop)

var fps = 0
setInterval(function () {
  console.log('fps', fps)
  fps = 0
}, 1000)
function updateLoop () {
  fps += 1
  window.requestAnimationFrame(updateLoop)
  points.forEach(function (point, i) {
    // var theta = (0.5 - Math.random()) * (Math.PI / 16)
    var x = point.x / 40
    var y = point.y / 40
    var z = Date.now() / 10000
    var s = simplex.noise3d(x, y, z)
    // var s = simplex.noise(x, y)
    var theta1 = s * (2 * Math.PI)
    var theta = (0.01 * theta1) + (0.99 * point.theta)
    // if (i === 0) console.log(s, theta)
    point.move(theta, SPEED)
  })
  triangles.update(points)
}

function createPoints (n, w, h) {
  var points = []

  var x, y
  for (var i = 0; i < n; i++) {
    x = Math.floor(Math.random() * w)
    y = Math.floor(Math.random() * h)
    points.push(createPoint([x, y]))
  }

  return points
}

function createPoint (coords) {
  var w = 20
  var h = w

  var el = document.createElement('div')
  el.style.position = 'absolute'
  el.style.left = coords[0] + 'px'
  el.style.top = coords[1] + 'px'
  el.style.width = w + 'px'
  el.style.height = h + 'px'
  el.style.borderRadius = w / 2 + 'px'
  el.style.background = '#aaa'

  var point = {
    el: el,
    x: coords[0],
    y: coords[1],
    theta: Math.random() * 2 * Math.PI,
    move: move
  }

  return point
}

function mod (a, n) {
  return ((a % n) + n) % n
}

function move (theta, r) {
  this.theta = theta
  this.x += r * Math.cos(this.theta)
  this.y += r * Math.sin(this.theta)

  this.x = mod(this.x, width)
  this.y = mod(this.y, height)

  this.el.style.left = this.x + 'px'
  this.el.style.top = this.y + 'px'
}

function createTrianges (points) {
  var stroke = '#ccc'
  var fill = 'rgba(0,0,0,0)'
  var viewBox = [0, 0, width, height].join(' ')

  var pathData = createPathData(points)

  var parent = document.createElement('div')
  parent.innerHTML = `
    <svg xmlns='http://www.w3.org/svg/2000'
      viewBox='${viewBox}'
      width=${width}
      height=${height}
      stroke='none'
      fill='none'>
      ${pathData}
    </svg>
  `
  return {
    el: parent,
    svg: parent.querySelector('svg'),
    update: update
  }
}

function createPathData (points) {
  var coords = points.map(function (point) {
    return [point.x, point.y]
  })

  var triangles = new Delaunator(coords).triangles

  var pathData = []

  var maxArea = 2 * (height * width) / (N_POINTS / 3)

  var x0, y0, x1, y1, x2, y2, d, fill, b, eq
  for (var i = 0; i < triangles.length; i += 3) {
    x0 = coords[triangles[i]][0]
    y0 = coords[triangles[i]][1]
    x1 = coords[triangles[i + 1]][0]
    y1 = coords[triangles[i + 1]][1]
    x2 = coords[triangles[i + 2]][0]
    y2 = coords[triangles[i + 2]][1]

    d = [
      'M', x0, y0,
      'L', x1, y1,
      'L', x2, y2,
      'L', x0, y0
    ].join(' ')

    // area = calcArea(x0, y0, x1, y1, x2, y2)
    eq = equalness(x0, y0, x1, y1, x2, y2)

    // b = Math.floor((area / maxArea) * 255)
    b = Math.floor(20 + (eq * 150))
    fill = `rgb(${b}, ${b}, ${b})`
    pathData.push(`<path d='${d}' fill='${fill}' stroke='${fill}' />`)
  }

  return pathData.join('\n')
}

function update (points) {
  this.svg.innerHTML = createPathData(points)
}

function calcArea (x0, y0, x1, y1, x2, y2) {
  return Math.abs(((x0 * (y1 - y2)) + (x1 * (y2 - y0)) + (x2 * (y0 - y1))) / 2)
}

function equalness (x0, y0, x1, y1, x2, y2) {
  var a = getDistance([x0, y0], [x1, y1])
  var b = getDistance([x0, y0], [x2, y2])
  var c = getDistance([x2, y2], [x1, y1])
  var diff = Math.abs(a - b) + Math.abs(a - c) + Math.abs(b - c)
  return 1 - (diff / (a + b + c))
}
