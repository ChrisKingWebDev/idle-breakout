require("pixi.js");
require("p2");
require("phaser");
import {buttons, upgrades, buttonStyles} from "./buttons";

let ball;
let paddle;
let bricks;
const getInitialBrickSet = () => {
    let brickSet =  [];
    for (let y = 0; y < 6; y++) {
        let row = [];
        for (let x = 0; x < 15; x++) {
            row.push(1);
        }
        brickSet.push(row);
    }
    return brickSet;
};

let brickSet = getInitialBrickSet();
let liveBricks = [];

let ballOnPaddle = true;

// let score = 0;

global.vars = {
    score: 0,
    ballInitialVelocity: 150,
    ballVelocity: 0,
    ballMaxVelocity: 300,
    ballRebound: 1.01,
    paddleAcceleration: 0.1,
    paddleDeceleration: 0.05,
    maxPaddleSpeed: 2
};

// let globalVars.ballInitialVelocity = 250;
// let globalVars.ballVelocity = globalVars.ballInitialVelocity;
// let ballMaxVelocity = 500;

// medium ball and paddle
// let ballRebound = 1.001;
// let maxPaddleSpeed = 4;
// let paddleAcceleration = 0.1;
// let paddleDeceleration = 5;

// medium ball and paddle
// let ballRebound = 1.001;
// let maxPaddleSpeed = 300;
// let paddleAcceleration = 40;
// let paddleDeceleration = 100;

// very fast ball and ball
// let ballRebound = 1.05;
// let maxPaddleSpeed = 30000;
// let paddleAcceleration = 5000;
// let paddleDeceleration = 5000;

let scoreText, speedText;
let introText;

global.updateLabels = () => {
    scoreText.text = "Score: " + global.vars.score;
    speedText.text = `Speed: ${parseFloat(global.vars.ballVelocity.toFixed(2))}/${global.vars.ballMaxVelocity} @ ${global.vars.ballRebound.toFixed(3)}`;
    renderButtonStyles();
};

let brickDelay = 5;
let brickHeight = 52;
let brickDropHeight = 10;
let brickStartHeight = 100;

const preload = () => {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.stage.backgroundColor = "#f9f9f9";
    game.state.disableVisibilityChange = true;

    game.load.atlas("breakout", "img/breakout.png", "img/breakout.json");
};

const create = () => {

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.checkCollision.down = false;

    bricks = game.add.group();
    bricks.enableBody = true;
    bricks.physicsBodyType = Phaser.Physics.ARCADE;
    bricks.y = brickStartHeight;

    let brick;
    brickSet.forEach((row, y) => {
        row.forEach((space, x) => {
            brick = bricks.create(120 + (x * 36), (y * brickHeight * -1), "breakout", `brick_${space}_1.png`);
            brick.level = space;
            brick.body.bounce.set(1);
            brick.body.immovable = true;
            brick.indexX = x;
            brick.indexY = y;
            brick.originalY = y;
            liveBricks[y] = liveBricks[y] || [];
            liveBricks[y][x] = brick;
            brick.inputEnabled = true;
            brick.events.onInputDown.add(brickClick, this);
        });
    });

    game.time.events.loop(Phaser.Timer.SECOND * brickDelay, dropBricks, this);

    paddle = game.add.sprite(game.world.centerX, 500, "breakout", "paddle_big.png");
    paddle.anchor.setTo(0.5, 0.5);
    // paddle.scale.x = 3;
    // paddle.scale.y = 8;
    game.physics.enable(paddle, Phaser.Physics.ARCADE);
    paddle.body.setSize(48,200);
    paddle.body.collideWorldBounds = false;
    paddle.body.bounce.set(1);
    paddle.body.immovable = true;
    paddle.currentVelocity = 0;

    ball = game.add.sprite(game.world.centerX, paddle.y - 16, "breakout", "ball_1.png");
    ball.anchor.set(0.5);
    ball.checkWorldBounds = true;
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    ball.body.collideWorldBounds = true;
    ball.body.bounce.set(1);
    ball.velX = () => {
        return ball.x - ball.lastX;
    };
    ball.needsRotation = false;
    ball.needsVelocity = false;

    ball.animations.add("spin", [ "ball_1.png", "ball_2.png", "ball_3.png", "ball_4.png", "ball_5.png" ], 50, true, false);

    ball.events.onOutOfBounds.add(ballLost, this);

    scoreText = game.add.text(32, 500, "Score: 0", { font: "20px Arial", fill: "#ffffff", stroke:"#000", strokeThickness: 5, align: "left" });
    speedText = game.add.text(game.world.width - 32, 500, `Speed: 0/${global.vars.ballMaxVelocity}`, { font: "20px Arial", fill: "#ffffff", stroke:"#000", strokeThickness: 5, align: "left" });
    speedText.anchor.x = 1;
    introText = game.add.text(game.world.centerX, 400, "- click to start -", { font: "40px Arial", fill: "#ffffff", align: "center" });
    introText.anchor.setTo(0.5, 0.5);


    menuGroup = game.add.group();
    // Create a label to use as a button
    buttons.forEach((button, i) => {
        let buttonText = game.add.text(32 + (i * 100), 525, button.text, buttonStyles.normal);
        // buttonText.anchor.set(0.5);
        buttonText.inputEnabled = true;
        buttonText.events.onInputOver.add(buttonOver.bind(buttonText));
        buttonText.events.onInputOut.add(buttonOut.bind(buttonText));
        buttonText.events.onInputUp.add(() => {
            toggleMenu(button.name);
        }, this);
    });

    game.input.onDown.add(releaseBall, this);
};

const buttonOver = (button) => {
    if (button.upgrade && !button.upgrade.enabled) {
        button.setStyle(buttonStyles.disabled);
    } else {
        button.setStyle(buttonStyles.hover);
    }
};
const buttonOut = (button) => {
    if (button.upgrade && !button.upgrade.enabled) {
        button.setStyle(buttonStyles.disabled);
    } else {
        button.setStyle(buttonStyles.normal);
    }
};

let currentMenu = "";
let menuGroup;
const toggleMenu = (menuName) => {
    menuGroup.removeAll();
    if (currentMenu === menuName) {
        // kill existing menu
        currentMenu = "";
    } else {
        upgrades[menuName].forEach((upgrade, i) => {

            let button = game.add.text(80 + (i * 120), 550, `${upgrade.text}\n${upgrade.data.cost}`, buttonStyles.normal);
            button.lineSpacing = -10;
            button.anchor.x = 0.5;
            button.inputEnabled = true;
            button.events.onInputOver.add(buttonOver.bind(button));
            button.events.onInputOut.add(buttonOut.bind(button));
            button.events.onInputUp.add(() => {
                upgrade.onClick();
                if (upgrade.name === "ballSpeed") {
                    game.physics.arcade.velocityFromRotation(ball.body.angle, global.vars.ballVelocity, ball.body.velocity);
                }
                button.text = `${upgrade.text}\n${upgrade.data.cost}`;
            }, this);
            button.upgrade = upgrade;
            menuGroup.addChild(button);
        });
        renderButtonStyles();
        currentMenu = menuName;
    }
};

const renderButtonStyles = () => {
    menuGroup.children.forEach((button) => {
        if (button.upgrade.enabled) {
            button.setStyle(buttonStyles.normal);
        } else {
            button.setStyle(buttonStyles.disabled);
        }
    });
};

// const paddleUnderBall = () => {
//     return ball.x >= paddle.left && ball.x <= paddle.right
// }
//
// const ballLeftOfPaddle = () => {
//     return ball.x < paddle.left
// }
//
// const ballRightOfPaddle = () => {
//     return ball.x > paddle.right
// }
//
// const paddleGoingLeft = () => {
//     return paddle.currentVelocity < 0;
// }
//
// const paddleGoingRight = () => {
//     return paddle.currentVelocity > 0;
// }

const ballGoingLeft = () => {
    return ball.body.velocity.x < 0;
};

const ballGoingRight = () => {
    return ball.body.velocity.x > 0;
};

const ballDistanceLeft = () => {
    // returning a negative number on purpose
    return ball.x - paddle.x + (paddle.width / 4);
};

const ballDistanceRight = () => {
    // returning a negative number on purpose
    return ball.x - paddle.x - (paddle.width / 4);
};

const paddleGoMoreRight = () => {
    if (paddle.currentVelocity < 0) {
        paddleDecelerateLeft();
    } else {
        paddleAccelerateRight();
    }
};

const paddleGoMoreLeft = () => {
    if (paddle.currentVelocity > 0) {
        paddleDecelerateRight();
    } else {
        paddleAccelerateLeft();
    }
};

const paddleAccelerateRight = () => {
    paddle.currentVelocity = paddle.currentVelocity + global.vars.paddleAcceleration;
    if (paddle.currentVelocity > global.vars.maxPaddleSpeed) {
        // going faster than it can
        paddle.currentVelocity = global.vars.maxPaddleSpeed;
        paddle.tint = 0xf2d415;
    }
    if (paddle.currentVelocity < global.vars.maxPaddleSpeed) {
        paddle.tint = 0x007a20;
    }
    // let desiredDistance = ballDistanceRight() + ball.velX();
    // if (paddle.currentVelocity > desiredDistance) {
    //     // going faster than the paddle now
    //     paddle.currentVelocity = desiredDistance;
    // }
};

const paddleAccelerateLeft = () => {
    paddle.currentVelocity = paddle.currentVelocity - global.vars.paddleAcceleration;
    if (paddle.currentVelocity < (global.vars.maxPaddleSpeed * -1)) {
        // going faster than it can
        paddle.currentVelocity = global.vars.maxPaddleSpeed * -1;
        paddle.tint = 0xf2d415;
    }
    if (paddle.currentVelocity > (global.vars.maxPaddleSpeed * -1)) {
        paddle.tint = 0x007a20;
    }
    // let desiredDistance = ballDistanceRight() + ball.velX();
    // if (paddle.currentVelocity < desiredDistance) {
    //     // going faster than the paddle now
    //     paddle.currentVelocity = desiredDistance;
    // }
};

const paddleDecelerateRight = () => {
    paddle.currentVelocity = paddle.currentVelocity - global.vars.paddleDeceleration;
    if (paddle.currentVelocity < 0) {
        paddle.currentVelocity = 0;
    }
    if (paddle.currentVelocity > 0) {
        paddle.tint = 0xd12806;
    }
};

const paddleDecelerateLeft = () => {
    paddle.currentVelocity = paddle.currentVelocity + global.vars.paddleDeceleration;
    if (paddle.currentVelocity > 0) {
        paddle.currentVelocity = 0;
    }
    if (paddle.currentVelocity < 0) {
        paddle.tint = 0xd12806;
    }
};

const dropBricks = () => {
    if (!ballOnPaddle) {
        bricks.y = bricks.y + brickDropHeight;
        if (bricks.y + liveBricks[0][0].y >= paddle.y - paddle.height) {
            resetLevel();
        }
    }
};

const update = () => {
    paddle.tint = 0xFFFFFF;
    if (!ballOnPaddle) {

        if (ballGoingRight()) {
            // paddle is to the left of the ball, go faster
            if (ballDistanceRight() > 0) {
                paddleGoMoreRight();
                let desiredDistance = ballDistanceRight() + ball.velX();
                if (paddle.currentVelocity > desiredDistance) {
                    // going faster than the paddle now
                    paddle.currentVelocity = desiredDistance;
                    paddle.tint = 0xFFFFFF;
                }
            } else if (ballDistanceLeft() < 0) {
                if (paddle.currentVelocity < 0) {
                    // paddle is going left, decelerate
                    // paddleDecelerateLeft();
                } else {
                    // ball is to the right of the paddle, but heading back towards it
                    // the paddle should just wait?
                }
            } else {
                if (paddle.currentVelocity < ball.velX()) {
                    // paddle is right under the ball, but going too slow
                    paddleGoMoreRight();
                    if (paddle.currentVelocity > ball.velX()) {
                        paddle.currentVelocity = ball.velX();
                        paddle.tint = 0xFFFFFF;
                    }
                } else if (paddle.currentVelocity > ball.velX()) {
                    // paddle is right under the ball, but going too fast

                    paddleDecelerateRight();
                    if (paddle.currentVelocity < ball.velX()) {
                        paddle.currentVelocity = ball.velX();
                        paddle.tint = 0xFFFFFF;
                    }
                }
            }
        } else if (ballGoingLeft()) {
            // paddle is to the left of the ball, go faster
            if (ballDistanceLeft() < 0) {
                paddleGoMoreLeft();
                let desiredDistance = ballDistanceLeft() + ball.velX();
                if (paddle.currentVelocity < desiredDistance) {
                    // going faster than the paddle now
                    paddle.currentVelocity = desiredDistance;
                    paddle.tint = 0xFFFFFF;
                }
            } else if (ballDistanceRight() > 0) {
                if (paddle.currentVelocity > 0) {
                    // paddle is going left, decelerate
                    // paddleDecelerateRight();
                } else {
                    // wait?
                }

            } else {
                if (paddle.currentVelocity > ball.velX()) {
                    // paddle is right under the ball, but going too slow
                    paddleGoMoreLeft();
                    if (paddle.currentVelocity < ball.velX()) {
                        paddle.currentVelocity = ball.velX();
                        paddle.tint = 0xFFFFFF;
                    }

                } else if (paddle.currentVelocity < ball.velX()) {
                    // paddle is right under the ball, but going too fast
                    paddleDecelerateLeft();
                    if (paddle.currentVelocity > ball.velX()) {
                        paddle.currentVelocity = ball.velX();
                        paddle.tint = 0xFFFFFF;
                    }
                }
            }
        }
        paddle.x = paddle.x + paddle.currentVelocity;

    } else  {
        paddle.x = game.input.x;
    }

    // keep in bounds of the level
    if (paddle.x < 24) {
        paddle.x = 24;
        paddle.currentVelocity = 0;
    } else if (paddle.x > game.width - 24) {
        paddle.x = game.width - 24;
        paddle.currentVelocity = 0;
    }

    ball.lastX = ball.x;

    if (ball.needsVelocity && global.vars.ballVelocity < global.vars.ballMaxVelocity) {
        global.vars.ballVelocity = global.vars.ballVelocity * global.vars.ballRebound;
        if (global.vars.ballVelocity > global.vars.ballMaxVelocity) {
            global.vars.ballVelocity = global.vars.ballMaxVelocity;
        }
        speedText.text = `Speed: ${parseFloat(global.vars.ballVelocity.toFixed(2))}/${global.vars.ballMaxVelocity} @ ${global.vars.ballRebound.toFixed(3)}`;
        game.physics.arcade.velocityFromRotation(ball.body.angle, global.vars.ballVelocity, ball.body.velocity);
        ball.needsVelocity = false;
    }

    if (ball.needsRotation !== false) {
        let diff = ball.needsRotation;
        if (Math.floor(Math.abs(diff)) < 3) {
            diff = getRandomInt(-20,20);
        }
        game.physics.arcade.velocityFromRotation(ball.body.angle + (diff / 1000), global.vars.ballVelocity, ball.body.velocity);
        ball.needsRotation = false;
    }

    bricks.children.forEach((brick) => {
        if (brick.y < brick.destinationY) {
            brick.y += 5;
            if (brick.y > brick.destinationY) {
                brick.y = brick.destinationY;
            }
        }
    });

    if (ballOnPaddle) {
        ball.x = paddle.x;
        ball.lastX = paddle.x;
    } else {
        game.physics.arcade.collide(ball, paddle, ballHitPaddle, null, this);
        game.physics.arcade.collide(ball, bricks, ballHitBrick, null, this);
    }
};

const ballLost = () => {
    global.vars.ballVelocity = global.vars.ballInitialVelocity;
    resetLevel();
};

const releaseBall = () => {
    if (ballOnPaddle) {
        ballOnPaddle = false;
        let randomAngle = getRandomInt(-135,-115);
        if (getRandomInt(0,1) === 1) {
            randomAngle = getRandomInt(-15,-35);
        }
        global.vars.ballVelocity = global.vars.ballInitialVelocity;
        game.physics.arcade.velocityFromAngle(randomAngle, global.vars.ballVelocity, ball.body.velocity);
        ball.animations.play("spin");
        introText.visible = false;
        speedText.text = `Speed: ${global.vars.ballVelocity}/${global.vars.ballMaxVelocity} @ ${global.vars.ballRebound}`;
    }
};

const brickClick = (_brick) => {
    brickKilled(_brick);
};

const ballHitBrick = (_ball, _brick) => {
    _ball.needsVelocity = true;
    brickKilled(_brick);
};

const brickKilled = (_brick) => {
    _brick.kill();

    global.vars.score += _brick.level * 1;

    scoreText.text = "Score: " + global.vars.score;
    renderButtonStyles();

    //  Are they any bricks left?
    if (bricks.countLiving() === 0) {
        //  New level starts
        global.vars.score += 1000;
        scoreText.text = "Score: " + global.vars.score;

        resetLevel();
    }
    let deadRow = false;
    let newBricks = [];
    liveBricks.forEach((row, y) => {
        if (y < _brick.indexY) {
            newBricks[y] = row;
        } else if (y === _brick.indexY) {
            let liveCells = row.filter((brick) => {
                return brick.alive === true;
            });
            if (liveCells.length === 0) {
                deadRow = true;
            }
        } else if (y > _brick.indexY && deadRow) {
            newBricks[y - 1] = row;
            newBricks[y - 1].forEach((brick, x) => {
                brick.indexY--;
                if (_brick.indexY > 0) {
                    brick.destinationY = brick.y + brickHeight;
                }
                newBricks[y - 1][x] = brick;
            });
        }
    });
    if (deadRow) {
        liveBricks = newBricks;
    }
};

const ballHitPaddle = (_ball, _paddle) => {
    let diff = _ball.x - _paddle.x;
    ball.needsRotation = diff;
};

const resetLevel = () => {
    paddle.x = game.world.centerX;
    paddle.y = 500;
    paddle.currentVelocity = 0;

    ball.x = game.world.centerX;
    ball.y =  paddle.y - 16;

    speedText.text = `Speed: ${global.vars.ballVelocity}/${global.vars.ballMaxVelocity} @ ${global.vars.ballRebound.toFixed(3)}`;

    let randomAngle = getRandomInt(-135,-115);
    if (getRandomInt(0,1) === 1) {
        randomAngle = getRandomInt(-15,-35);
    }
    game.physics.arcade.velocityFromAngle(randomAngle, global.vars.ballVelocity, ball.body.velocity);

    //  And bring the bricks back from the dead :)
    bricks.callAll("revive");
    bricks.y = brickStartHeight;
    liveBricks = [];
    bricks.children.forEach((brick) => {
        brick.indexY = brick.originalY;
        brick.y = brick.indexY * brickHeight * -1;
        brick.destinationY = brick.y;
        liveBricks[brick.indexY] = liveBricks[brick.indexY] || [];
        liveBricks[brick.indexY][brick.indexX] = brick;
    });
};

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const render = () => {
    // game.debug.body(ball);
    // game.debug.body(paddle);
};

let game = new Phaser.Game(800, 600, Phaser.ScaleManager.SHOW_ALL, "game-container", {
    preload, create, update, render
});
