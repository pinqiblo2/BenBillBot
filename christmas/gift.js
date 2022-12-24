//https://stackoverflow.com/questions/43928602/html-canvas-get-total-fill-in-percent

const GRID_SIZE = 50;
const DRAW_SIZE = 25;

var ExposeImage = function(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const cols = width / GRID_SIZE;
  const rows = height / GRID_SIZE;

  this.gridBlocks = Array(rows * cols);
  this.dirtyBlocks = Array(rows * cols);

  const gridBlockIndex = (c, r) => r * cols + c;
  const rcFromBlockIndex = i => [
    Math.floor(i / cols),
    i % cols
  ];

  this.context = canvas.getContext("2d");

  this.init();

  var logDirtyGridBoxes = function(e) {
    var x = e.clientX;
    var y = e.clientY;
    var r = DRAW_SIZE;

    var top = Math.max(Math.min(y - r, height-1), 0);
    var bottom = Math.max(Math.min(y + r, height - 1), 0);
    var left = Math.max(Math.min(x - r, width-1), 0);
    var right = Math.max(Math.min(x + r, width - 1), 0);

    var corners = [
      [top, left],
      [top, right],
      [bottom, right],
      [bottom, left]
    ];

    corners.forEach(c => {
      const row = Math.floor(c[0] / GRID_SIZE);
      const col = Math.floor(c[1] / GRID_SIZE);
      const i = gridBlockIndex(col, row);
      this.dirtyBlocks[i] =
        /* top left of the grid block */
        [col * GRID_SIZE, row * GRID_SIZE];
    });

  }.bind(this);

  var update = function() {
    // Store the transparent pixel count for all our dirty
    // grid boxes
    this.dirtyBlocks.forEach((coords, i) => {
      const data = this.context.getImageData(
        coords[0], coords[1], GRID_SIZE, GRID_SIZE).data;

      this.gridBlocks[i] = transparentPixelCount(data)
    })

    // Clear dirty array
    this.dirtyBlocks = Array(rows * cols);

    // Calculate total average
    const total = this.gridBlocks.reduce((sum, b) => sum + b, 0);
    const avg = Math.round(
      total / (width * height) * 100);

    if (avg >= 80)
        openGift()
  }.bind(this);

  // Event listeners
  var onMove = function(e) {
    this.clear(e.clientX, e.clientY, DRAW_SIZE);

    logDirtyGridBoxes(e);
    requestAnimationFrame(update);
  }.bind(this);

  var onTouch = function(e) {
    e.preventDefault();
    var touch = e.targetTouches[0];
    var rect = canvas.getBoundingClientRect();
    var fakeEvent = {
        clientX: Math.floor((touch.pageX-rect.left)/(rect.right-rect.left)*canvas.width),
        clientY: Math.floor((touch.pageY-rect.top)/(rect.bottom-rect.top)*canvas.height)
    };

    onMove(fakeEvent);
  }

  canvas.addEventListener("mousedown", function(e) {
    canvas.addEventListener("mousemove", onMove);
    onMove(e);
  }.bind(this));

  canvas.addEventListener("mouseup", function() {
    canvas.removeEventListener("mousemove", onMove);
  }.bind(this));

  canvas.addEventListener("touchstart", function(e) {
    canvas.addEventListener("touchmove", onTouch);
  }.bind(this));

  canvas.addEventListener("touchend", function() {
    canvas.removeEventListener("touchmove", onTouch);
  }.bind(this));
};

ExposeImage.prototype.init = function(context) {
  img = new Image();
  img.onload = function(){  
      this.context.drawImage(img, 0, 7, 300, 285);
  }.bind(this)
  img.src = 'present.webp';
};

ExposeImage.prototype.clear = function(x, y, r) {
  this.context.beginPath();
  this.context.arc(x - 0, y, r, 0, Math.PI * 2);
  this.context.fillStyle = '#FFF';
  this.context.fill();
};

// App:
var canvas = document.querySelector("canvas");
var ei = new ExposeImage(canvas);

function transparentPixelCount(data) {
  let transparent = 0;
  for (let i = 0; i < data.length; i += 4) {
    transparent += (data[i] & data[i+1] & data[i+2] & data[i+3] & 0xFF) ? 1 : 0;
  }
  return transparent;
}

function openGift() {
    var gift = document.getElementById('gift');
    var canvas = document.querySelector("canvas");
    canvas.style.display = 'none'
    gift.style.display = 'block';
}