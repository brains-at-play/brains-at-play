//Noel Case, 2-21-20
//This contains all data structures for the 
//audio functionality in the Brain Battle game
class music {
  constructor(root){
    //programming the drone
    this.root = root;
    this.drone = [new p5.Oscillator('sine'), new p5.Oscillator('sine'), new p5.Oscillator('sine'), new p5.Oscillator('sine')];
  }
  
   setVolume(volCurr) {
     this.drone[0].amp(volCurr * 0.125);
     this.drone[1].amp(volCurr * 0.08);
     this.drone[2].amp(volCurr * 0.06);
     this.drone[3].amp(volCurr * 0.075);
   }

  startDrone(volMain) {
    var fade;
    this.drone[0].start(0, this.root);
    this.drone[1].start(0, (2 * this.root) - 0.25);
    this.drone[2].start(0, (3 * this.root) + 0.125);
    this.drone[3].start(0, (5 * this.root) - 0.125); 
    for(fade = 0; fade <= 1; fade += pow(10, -3))
      this.setVolume(fade * volMain);
  }
   
  stop(volMain) {
    for(var fade = 1; fade > 0; fade -= pow(10, -4))
        this.setVolume(fade * volMain);
  }
  
   updateDetune(health, healthInit){
     if (health <= healthInit) {
     this.drone[1].freq(2 * this.root + 20 * (1 - exp((1 / 80) * (health - healthInit)) + 0.125));
     this.drone[2].freq(3 * this.root + 6 * (1 - exp((1 / 80) * (health - healthInit)) - 0.125));
   }
 }
}
  
class sfx {
  constructor(root) {
    this.root = root;
    this.alert = [new p5.Oscillator('sine'), new p5.Oscillator('sine'), new p5.Oscillator('sine'), new p5.Oscillator('sine')];
    //for (var i = 0; i < 4; i++)
    //  this.alert[i].setADSR(0.001, 0.3, 0.9, 0.08);
  }
  
  playAlert(nVel) {
    this.alert[0].start(0, this.root * (1.06 / 2));
    this.alert[1].start(0, this.root * (1.06));
    this.alert[2].start(0, this.root * (2 * 1.06));
    this.alert[3].start(0, this.root * (4 * 1.06));

    this.alert[0].amp(nVel, 0.08);
    this.alert[1].amp(nVel / 3, 0.08);
    this.alert[2].amp(nVel / 6, 0.08);
    this.alert[3].amp(nVel / 8, 0.08);

    this.alert[0].stop(0.3);
    this.alert[1].stop(0.3);
    this.alert[2].stop(0.3);
    this.alert[3].stop(0.3);
  }
  
  setVolume(volMain, nVel){ 
   this.alert[0].amp(this.volMain * this.nVel, 0.01);
   this.alert[1].amp(volMain * this.nVel / 3, 0.01)
   this.alert[2].amp(this.volMain * this.nVel / 6, 0.01);
   this.alert[3].amp(this.volMain * this.nVel / 8, 0.01);
  }
}  
