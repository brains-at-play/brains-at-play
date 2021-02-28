// Connection Management
function toggleConnection(){

    console.log('connection toggling',game.info,game.me)
    if (game.info.simulated == true){
        if ([undefined,"me"].includes(game.me.username)){
            toggleLoginScreen();
        } else {
        document.getElementById("connection-button").innerHTML = 'Disconnect';
        if (window.innerWidth >= 768) {
            document.getElementById('id-params').style.display = `block`;
            document.getElementById('nBrains-params').style.display = `block`;
            document.getElementById('nInterfaces-params').style.display = `block`;
        }
        document.getElementById('access-mode-div').innerHTML = ` 
        <p id="access-mode" class="small">Public Mode</p>
        <label id="access-switch" class="switch">
            <input type="checkbox" onchange="toggleAccess()" checked>
            <span class="slider round"></span>
          </label>
          `}
    } else {
        game.disconnect()
        announcement(`<div>Exiting the Brainstorm
        <p class="small">Thank you for playing!</p></div>`)
        if (window.innerWidth >= 768) {
            document.getElementById('id-params').style.display = `none`;
            document.getElementById('nBrains-params').style.display = `none`;
            document.getElementById('nInterfaces-params').style.display = `none`;
        }
        document.getElementById('access-mode-div').innerHTML = ` 
        <p id="access-mode" class="small">Not Connected</p>
        `
        document.getElementById("connection-button").innerHTML = `
                            Connect
                            <span class="tooltiptext"><p>Connect to Network</p><hr/><p class="small">View live brain data from Brains@Play server</p></span>
        `;
        state = 1;
        updateSignalType('signaltype','voltage')
        stateManager(true)
        updateUI()
    }
}

async function login(type='guest'){
    let form = document.getElementById('login-form')
    let formDict = {}
    if (type === 'guest'){
        formDict.guestaccess = true
    } else {
        let formData = new FormData(form);
        for (var pair of formData.entries()) {
            formDict[pair[0]] = pair[1]; 
        }
        formDict.guestaccess = false
    }

    await game.connect(formDict,url).then((resDict) =>{
        console.log('connected')
        if (resDict.result == 'OK'){
            document.getElementById('userId').innerHTML = game.me.username
            form.reset()
            toggleLoginScreen();
            toggleConnection();
        } else {
            document.getElementById('login-message').innerHTML = resDict.msg
        }
    })
}

async function signup(){
    let form = document.getElementById('signup-form')
    let formData = new FormData(form);
    let formDict = {}
    for (var pair of formData.entries()) {
        formDict[pair[0]] = pair[1]; 
    }

    if (formDict['username'] === ''){
        document.getElementById('signup-message').innerHTML = "username is empty. please try again."
    } else if (formDict['password'] ===''){
        document.getElementById('signup-message').innerHTML = "password is empty. please try again."
    }  else if (formDict['password'] !== formDict['confirm-password']) {
            document.getElementById('signup-message').innerHTML = "passwords don't match. please try again."
    }
    else {

        let resDict = await game.signup(formDict,url);
        if (resDict.result == 'OK'){
            form.reset()
            toggleLoginScreen();
            toggleSignUpScreen();
        } else {
            document.getElementById('signup-message').innerHTML = resDict.msg
        }
    }
}

// Cookies
function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(req,name) {
    const value = `; ${req.headers.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
