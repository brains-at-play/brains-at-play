
var clat = 0;
var clon = 0;

class MapPoint {
  constructor(lat,lon,d) {
    var cx = mercX(clon);
    var cy = mercY(clat);
    var x = mercX(lon) - cx;
    if(x < - 1024/2) {
      x += 1024;
    } else if(x > 1024 / 2) {
      x -= 1024;
    }
    this.x = x;
    this.y = mercY(lat) - cy;
    this.d = d;
    this.c = color(255,0,0,75)
  }
}

function mercX(lon) {
  lon = radians(lon);
  var a = (256 / PI) * pow(2, zoom);
  var b = lon + PI;
  return a * b;
}

function mercY(lat) {
  lat = radians(lat);
  var a = (256 / PI) * pow(2, zoom);
  var b = tan(PI / 4 + lat / 2);
  var c = PI - log(b);
  return a * c;
}
