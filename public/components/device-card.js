

function openDevices() {
  if (document.getElementById("device-card")){
  document.getElementById("device-card").style.transform = "translateX(0%)";
  document.getElementById("devToggle").onclick =function() {closeDevices()};
  }
}

  function closeDevices() {
    if (document.getElementById("device-card")){
    document.getElementById("device-card").style.transform = "translateX(100%)";
    document.getElementById("devToggle").onclick = function() {openDevices()};
    }
  }

  async function connectMuse(){
    await game.bluetooth.devices['muse'].connect()
    game.connectBluetoothDevice('muse')
  }
  
  class DeviceCard extends HTMLElement {
    constructor() {
      super();
    }

  connectedCallback() {
    let html = `
    <style>

    #device-card {
      box-sizing: border-box;
      display: block;
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      transform: translateX(100%);
      padding: 25px;
      background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6));
      z-index: 100;

      transition: 0.5s ease-in-out;
      -o-transition: 0.5s ease-in-out;
      -ms-transition: 0.5s ease-in-out;
      -moz-transition: 0.5s ease-in-out;
      -webkit-transition: 0.5s ease-in-out;
  }

  #device-card .small{
      font-size: 10px;
  }
  
  #device-card p{
      font-size: 80%
  }
  
  #device-card ol{
      font-size: 80%
  }
  
  #device-card ol p{
      font-size: 100%
  }
  
  #device-card h4{
      margin: 0px;
  }

  #device-card a{
      color: #6a8eb0;
      text-decoration: none;
  }
  
  #device-card a:visited{
      color: gray;
  }

  .device-icon {
      box-sizing: border-box;
      position: fixed;
      right: 100%;
      top: 25px;
      transform: translateX(-100%);
      padding: 1em;
      width: 40px;
      z-index: 1000;
      transition: 0.5s ease-in-out;
      -o-transition: 0.5s ease-in-out;
      -ms-transition: 0.5s ease-in-out;
      -moz-transition: 0.5s ease-in-out;
      -webkit-transition: 0.5s ease-in-out;
  }

  .arrow {
      border: solid white;
      border-width: 0 5px 5px 0;
      display: inline-block;
      padding: 5px;
      transition: 0.5s ease-in-out;
      -o-transition: 0.5s ease-in-out;
      -ms-transition: 0.5s ease-in-out;
      -moz-transition: 0.5s ease-in-out;
      -webkit-transition: 0.5s ease-in-out;
  }

  .left {
      transform: rotate(135deg);
      -webkit-transform: rotate(135deg);
  }

  /* Tooltip container */
  .tooltip {
      position: relative;
      display: block;
  }

  /* Tooltip text */
  .tooltip .tooltiptext {
      visibility: hidden;
      width: 150px;
      background: linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8));
      color: white;
      text-align: center;
      padding: 10px 10px;
      border-radius: 6px;
      top: 50%;
      right: 105%;
      transform: translateY(-50%);

      /* Position the tooltip text - see examples below! */
      position: absolute;
      z-index: 1;
  }

  .tooltip .tooltiptext p{
      font-size: 15px;
      margin: 0;
  }

  .tooltip .tooltiptext .small{
      font-size: 80%;
  }

  .tooltip .tooltiptext::after {
      content: " ";
      position: absolute;
      top: 50%;
      left: 100%; /* To the right of the tooltip */
      margin-top: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent transparent transparent white;
  }

  /* Show the tooltip text when you mouse over the tooltip container */
  .tooltip:hover .tooltiptext {
      visibility: visible;
      pointer-events:none;
  }
}
    </style>

    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" rel="stylesheet">
      <div id="device-card">
      <div id="devToggle" onclick="openDevices()" class="device-icon">
      <i class="fas fa-brain fa-lg"></i>
      </div>
        <h4>Connect an EEG Device</h4>
        <br/>
        <button id="connect-muse" class="tooltip" onclick="connectMuse()">
            Muse
            <span class="tooltiptext"><p>Connect a Muse Headband</p><hr/><p class="small">Connect your Muse headband over Bluetooth. Chrome only.</p></span>
        </button>

        <button id="connect-muse" class="tooltip" onclick="game.connectBluetoothDevice('freeEEG32');">
            FreeEEG32 - 19 Channels
            <span class="tooltiptext"><p>Connect a 19-Channel FreeEEG32 Device</p><hr/><p class="small">Connect a 19-channel FreeEEG32 device over Serial. Chrome only.</p></span>
        </button>

        <button id="connect-muse" class="tooltip" onclick="game.connectBluetoothDevice('freeEEG32',{A4:'Fp2',A24:'Fp1'});">
            FreeEEG32 - 2 Channels
            <span class="tooltiptext"><p>Connect a 2-Channel FreeEEG32 Device</p><hr/><p class="small">Connect a 2-channel FreeEEG32 device over Serial. Chrome only.</p></span>
        </button>
        
    `;
    this.innerHTML = html
  }
}

  customElements.define('device-card', DeviceCard);
