
brainsatplay.settings = {

    // Game Name
    name: 'alphabattle',

    // Local and Server-Side Data
    data: {
        local: {
            player: {
            raw: true, game: {
                attack: async () => await game.getMetric('beta').then(dict => {return dict.average}),
                defense: async () => await game.getMetric('alpha').then(dict => {return dict.average}),
                }
            }
        }, 
        // server: {
        //     player: {
        //         health: {
        //             init: 100,
        //             callback: () => game.data.health - (opponent.data.attack - me.data.defense)
        //         }
        //     }
        // }
    }, 

    // Rules to Win or Lose the Game
    rules: {
        win: () => me.data.health <= 0,
        lose: () => opponent.data.health <= 0
    },

    // Number of Players per Game
    players: {
        teams: {
            names: ['Player One', 'Player Two'],
            size: 1
            // roles: {
            //     players: 1
            // }
    }
    }
}