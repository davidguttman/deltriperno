var query = require('querystring').parse(window.location.search.slice(1))
var Simplex = require('perlin-simplex')
var Delaunator = require('delaunator')
var getDistance = require('euclidean-distance')

var simplex = new Simplex()

var SPEED = query.speed ? query.speed / 1000 : 0.001
var N_POINTS = query.points ? parseFloat(query.points) : 200
var HUE = query.hue || 0
var SAT = query.saturation || 0

document.body.style.background = 'rgb(20, 20, 20)'

var stage = createStage()
document.body.appendChild(stage)

var points = createPoints(N_POINTS)
var triangles = createTrianges(points)
stage.appendChild(triangles.el)

window.requestAnimationFrame(updateLoop)

function updateLoop () {
  window.requestAnimationFrame(updateLoop)
  points.forEach(function (point) { point.update() })
  triangles.update(points)
}

function createPoints (n) {
  var points = []

  for (var i = 0; i < n; i++) {
    points.push({
      x: Math.random(),
      y: Math.random(),
      theta: Math.random() * 2 * Math.PI,
      update: updatePoint
    })
  }

  return points
}

function updatePoint () {
  var nx = this.x * 5
  var ny = this.y * 10
  var nz = Date.now() / 1000
  var s = simplex.noise3d(nx, ny, nz)

  var theta = s * 2 * Math.PI
  this.theta = (0.01 * theta) + (0.99 * this.theta)

  this.x += SPEED * Math.cos(this.theta)
  this.y += SPEED * Math.sin(this.theta)

  this.x = mod(this.x, 1)
  this.y = mod(this.y, 1)
}

function createTrianges (points) {
  var ns = 'http://www.w3.org/2000/svg'
  var viewBox = [0, 0, 1, 1].join(' ')

  var parent = document.createElement('div')
  parent.style.width = '100%'
  parent.style.height = '100%'
  parent.innerHTML = `
    <svg xmlns='${ns}'
      viewBox='${viewBox}'
      width='100%'
      height='100%'
      stroke='none'
      fill='none'>
    </svg>
  `

  var svg = parent.children[0]

  return {
    el: parent,
    update: function (points) {
      var paths = createPathData(points)
      paths.forEach(function (p, i) {
        var child = svg.children[i]
        if (!child) {
          child = document.createElementNS(ns, 'path')
          child.setAttributeNS(null, 'stroke', 'none')
          svg.appendChild(child)
        }

        child.setAttributeNS(null, 'd', p[0])
        child.setAttributeNS(null, 'fill', p[1])
      })

      for (var i = paths.length; i < svg.children.length; i++) {
        svg.children[i].setAttributeNS(null, 'fill', 'rgba(0,0,0,0)')
      }
    }
  }
}

function createPathData (points) {
  var coords = points.map(function (point) {
    return [point.x, point.y]
  })

  var triangles = new Delaunator(coords).triangles

  var pathData = []
  for (var i = 0; i < triangles.length; i += 3) {
    pathData.push(createTrianglePath(
      coords[triangles[i + 0]],
      coords[triangles[i + 1]],
      coords[triangles[i + 2]]
    ))
  }

  return pathData
}

function createTrianglePath (pa, pb, pc) {
  var x0 = pa[0]
  var y0 = pa[1]
  var x1 = pb[0]
  var y1 = pb[1]
  var x2 = pc[0]
  var y2 = pc[1]

  var d = [
    'M', x0, y0,
    'L', x1, y1,
    'L', x2, y2,
    'L', x0, y0
  ].join(' ')

  var eq = equalness(x0, y0, x1, y1, x2, y2)
  eq = eq * eq

  var b = Math.floor(30 + (eq * 70))
  var fill = `hsl(${HUE}, ${SAT}%, ${b}%)`

  return [d, fill]
  // return `<path d='${d}' fill='${fill}' stroke='none' />`
}

function equalness (x0, y0, x1, y1, x2, y2) {
  var a = getDistance([x0, y0], [x1, y1])
  var b = getDistance([x0, y0], [x2, y2])
  var c = getDistance([x2, y2], [x1, y1])
  var diff = Math.abs(a - b) + Math.abs(a - c) + Math.abs(b - c)
  return 1 - (diff / (a + b + c))
}

function createStage (w, h) {
  var stage = document.createElement('div')
  stage.style.position = 'absolute'
  stage.style.top = '10%'
  stage.style.left = '10%'
  stage.style.width = '80%'
  stage.style.height = '80%'
  return stage
}

function mod (a, n) {
  return ((a % n) + n) % n
}
