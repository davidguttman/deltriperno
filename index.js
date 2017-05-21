var Delaunator = require('delaunator')

var SPEED = 0.20
var N_POINTS = 550

var width = window.innerWidth
var height = window.innerHeight

document.body.style.background = 'rgb(20, 20, 20)'

var points = createPoints(N_POINTS, width, height)

points.forEach(function (point) {
  // document.body.appendChild(point.el)
})

var triangles = createTrianges(points)
document.body.appendChild(triangles.el)

window.requestAnimationFrame(updateLoop)

function updateLoop () {
  window.requestAnimationFrame(updateLoop)
  points.forEach(function (point) {
    var theta = (0.5 - Math.random()) * (Math.PI / 16)
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
  this.theta += theta
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
      stroke='${stroke}'
      fill='${fill}'>
      <path d='${pathData}' />
    </svg>
  `
  return {
    el: parent,
    path: parent.querySelector('path'),
    update: update
  }
}

function createPathData (points) {
  var coords = points.map(function (point) {
    return [point.x, point.y]
  })

  var triangles = new Delaunator(coords).triangles

  var pathData = []

  var x0, y0, x1, y1, x2, y2
  for (var i = 0; i < triangles.length; i += 3) {
    x0 = coords[triangles[i]][0]
    y0 = coords[triangles[i]][1]
    x1 = coords[triangles[i + 1]][0]
    y1 = coords[triangles[i + 1]][1]
    x2 = coords[triangles[i + 2]][0]
    y2 = coords[triangles[i + 2]][1]
    pathData.push('M')
    pathData.push(x0)
    pathData.push(y0)
    pathData.push('L')
    pathData.push(x1)
    pathData.push(y1)
    pathData.push('L')
    pathData.push(x2)
    pathData.push(y2)
    pathData.push('L')
    pathData.push(x0)
    pathData.push(y0)
  }

  return pathData.join(' ')
}

function update (points) {
  this.path.setAttribute('d', createPathData(points))
}
