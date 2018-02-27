const buttonStyles = {
    normal: {
        font: "normal 18px Arial",
        fill: "#fff",
        stroke:"#000",
        strokeThickness: 5,
        align: "center",
        boundsAlignH: "center", // bounds center align horizontally
        boundsAlignV: "middle" // bounds center align vertically
    },
    hover: {
        font: "normal 18px Arial",
        fill: "#0d49ff",
        stroke:"#000",
        strokeThickness: 5,
        align: "center",
        boundsAlignH: "center", // bounds center align horizontally
        boundsAlignV: "middle" // bounds center align vertically
    },
    disabled: {
        font: "normal 18px Arial",
        fill: "#bbb",
        stroke:"#000",
        strokeThickness: 5,
        align: "center",
        boundsAlignH: "center", // bounds center align horizontally
        boundsAlignV: "middle" // bounds center align vertically
    }
};

const buttons = [
    {
        name: "ball",
        text: "Ball"
    },
    {
        name: "paddle",
        text: "Paddle"
    },
    {
        name: "bricks",
        text: "Bricks"
    }
];

// the data is kept separate for saving and loading
let upgradeData = {
    "ballSpeed": {
        cost: 10,
        level: 0
    },
    "ballTopSpeed": {
        cost: 50,
        level: 0
    },
    "ballBounce": {
        cost: 100,
        level: 0
    },
    "ballDamage": {
        cost: 10000,
        level: 0
    }
};

class Upgrade {
    constructor(name, text, clickFunction, enabledFunction) {
        this.name = name;
        this.text = text;
        this.data = upgradeData[name] || {};
        this.onClick = () => {
            if (this.enabled || 1 === 1) {

                // do the actions that will be the same across all functions
                // global.vars.score -= this.data.cost;

                clickFunction(this.data);

                global.updateLabels();
            }
        };
        this.enabledFunction = enabledFunction;
    }
    get enabled() {
        return global.vars.score >= this.data.cost && (this.enabledFunction && this.enabledFunction());
    }
}

let upgrades = {
    ball : [
        new Upgrade("ballSpeed","Start Speed",(data) => {
            global.vars.ballInitialVelocity += 50;
            if (global.vars.ballVelocity < global.vars.ballInitialVelocity) {
                global.vars.ballVelocity = global.vars.ballInitialVelocity;
            }
            data.cost = data.cost * 2;


        }, () => {
            return global.vars.ballInitialVelocity < global.vars.ballMaxVelocity;
        }),
        new Upgrade("ballTopSpeed","Top Speed",(data) => {
            global.vars.ballMaxVelocity += 50;
            data.cost = data.cost * 2;
        }),
        new Upgrade("ballBounce","Bounce",() => {
        }),
        new Upgrade("ballDamage","Damage",() => {
        })
    ],
    paddle: [
        {
            name: "paddleWider",
            text: "Wider Paddle",
            cost: 20
        },
        {
            name: "paddleAcceleration",
            text: "Acceleration",
            cost: 50
        },
        {
            name: "paddleBrakes",
            text: "Brakes",
            cost: 500
        }
    ]
};

export {buttons, upgrades, upgradeData, buttonStyles};
