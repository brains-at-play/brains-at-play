

function openInfo() {
  if (document.getElementById("info-card")){
  document.getElementById("info-card").style.transform = "translateX(0%)";
  document.getElementById("navToggle").onclick =function() {closeInfo()};
  document.getElementById("nav-arrow").style.transform = 'rotate(135deg)'
  }
}

  function closeInfo() {
    if (document.getElementById("info-card")){
    document.getElementById("info-card").style.transform = "translateX(-100%)";
    document.getElementById("navToggle").onclick = function() {openInfo()};
    document.getElementById("nav-arrow").style.transform = 'rotate(-45deg)'
    }
  }
  
  class InfoCard extends HTMLElement {
    constructor() {
      super();
    }

  connectedCallback() {
    let name = this.getAttribute("name")
    let author = this.getAttribute("author")
    let website = this.getAttribute("website")
    let description = this.getAttribute("description")
    let links = JSON.parse(this.getAttribute("links"))

    let html = `
    <style>
    svg {
      box-sizing: border-box;
      flex: none;
      fill: lightgrey;
      transition: .5s;
      width: 20px;
      margin: 10px;
  }

    #info-card {
      box-sizing: border-box;
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      transform: translateX(0%);
      width: 400px;
      padding: 25px;
      background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6));
      z-index: 1000;

      transition: 0.5s ease-in-out;
      -o-transition: 0.5s ease-in-out;
      -ms-transition: 0.5s ease-in-out;
      -moz-transition: 0.5s ease-in-out;
      -webkit-transition: 0.5s ease-in-out;
  }

  #info-card .small{
      font-size: 10px;
  }
  
  #info-card p{
      font-size: 80%
  }
  
  #info-card ol{
      font-size: 80%
  }
  
  #info-card ol p{
      font-size: 100%
  }
  
  #info-card h4{
      margin: 0px;
  }
  
  #info-card a{
      color: #6a8eb0;
      text-decoration: none;
  }
  
  #info-card a:visited{
      color: gray;
  }

  .info-icon {
      box-sizing: border-box;
      position: fixed;
      display: flex;
      justify-content: center;
      align-items: center;
      right: 0px;
      top: 25px;
      transform: translateX(150%);
      padding: 1em;
      width: 40px;
      z-index: 100;
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
    </style>

      <div id="info-card">
      <div id="navToggle" onclick="closeInfo()" class="info-icon">
      <i id="nav-arrow" class="arrow left"></i>
      </div>
        <h4>${name}</h4>
        <p class="small">Created by <a href=${website} target="_blank">${author}</a>. See all examples <a href="https://brainsatplay.com/#game-nav" target="_blank">here</a></p>
        <p>${description}</p>
    `;

    if (Object.keys(links).length > 0){
       html += `<h5>Source</h5>`
    }
  for (let link in links) {
    if (link === 'github'){
      html += `
      <a href=${links[link]} label='Github' target="_blank">
      <svg viewBox="0 0 24 24">
          <path d = "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
  </a>`
    } if (link === 'p5'){
      html += `
      <a href=${links[link]} label="p5 Editor" target="_blank">
      <svg viewBox="0 0 28 28" style={
      flex: 'none',
      fill: 'lightgrey',
      width: '20px',
      margin: '10px',
      }>
          <path d="M16.909 10.259l8.533-2.576 1.676 5.156-8.498 2.899 5.275 7.48-4.447 3.225-5.553-7.348-5.408 7.155-4.318-3.289 5.275-7.223L.88 12.647l1.678-5.16 8.598 2.771V1.364h5.754v8.895z"></path>
      </svg>
  </a>`
    }
    }
    html += `</div>`
    this.innerHTML = html
  }
}

  customElements.define('info-card', InfoCard);
