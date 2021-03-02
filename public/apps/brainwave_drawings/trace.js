class Trace {
  constructor(center,size) {
    this.center = center;
    this.history = Array.from({length: 15}, e => e = this.center)
    this.size = size
  }
  
  update(x,y){
    this.history.shift()
    this.history.push([x,y])
  }
}