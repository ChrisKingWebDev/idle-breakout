const buttonStyle = {
    font: "normal 18px Arial",
    fill: "#fff",
    stroke:"#000",
    strokeThickness: 5,
    align: 'center',
    boundsAlignH: "center", // bounds center align horizontally
    boundsAlignV: "middle" // bounds center align vertically
};

const buttonOverStyle  = {
    font: "normal 18px Arial",
    fill: "#0d49ff",
    stroke:"#000",
    strokeThickness: 5,
    align: 'center',
    boundsAlignH: "center", // bounds center align horizontally
    boundsAlignV: "middle" // bounds center align vertically
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

const menus = {
    ball : [
        {
            name: "ballSpeed",
            text: "Faster Ball",
            cost: 10
        },
        {
            name: "ballBounce",
            text: "Ball Bounce",
            cost: 50
        },
        {
            name: "ballDamage",
            text: "Ball Damage",
            cost: 100
        }
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
}

const levels = {
    fasterBall : {

    }
}

export {buttons, menus, buttonStyle, buttonOverStyle};
