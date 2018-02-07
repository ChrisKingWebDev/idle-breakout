require('pixi.js');
require('p2');
require('phaser');

var ball;
var paddle;
var bricks;
var ship;
var cursors;

const getInitialBrickSet = () => {
    let brickSet =  [];
    for (var y = 0; y < 4; y++)
    {
        let row = [];
        for (var x = 0; x < 15; x++)
        {
            row.push(1);
        }
        brickSet.push(row);
    }
    return brickSet;
}
var brickSet = getInitialBrickSet();

var ballOnPaddle = true;

var score = 0;

var ballInitialVelocity = 500;
var ballVelocity = ballInitialVelocity;
var ballRebound = 1.05;

// var maxPaddleSpeed = 300;
// var paddleAcceleration = 40;
// var paddleDeceleration = 100;
var maxPaddleSpeed = 30000;
var paddleAcceleration = 5000;
var paddleDeceleration = 5000;

var scoreText;
var introText;

const preload = () => {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.stage.backgroundColor = '#eee';
    game.load.atlas('breakout', 'img/breakout.png', 'img/breakout.json');

}
const create2 = () => {
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setImpactEvents(true);
    game.physics.p2.restitution = 1;
    game.physics.p2.applyDamping = false;
    // game.physics.arcade.checkCollision.down = false;
    // game.physics.p2.setBoundsToWorld(true, true, true, false, true);
    var ballCollisionGroup = game.physics.p2.createCollisionGroup();
    var brickCollisionGroup = game.physics.p2.createCollisionGroup();
    var paddleCollisionGroup = game.physics.p2.createCollisionGroup();
    game.physics.p2.updateBoundsCollisionGroup();

    material1 = game.physics.p2.createMaterial();
    material2 = game.physics.p2.createMaterial();
    game.physics.p2.createContactMaterial(material1, material2, { friction: 0 , restitution: 1.0 });

    bricks = game.add.group();
    bricks.enableBody = true;
    bricks.physicsBodyType = Phaser.Physics.P2JS;

    var brick;
    brickSet.forEach((row, y) => {
        row.forEach((space, x) => {
            brick = bricks.create(120 + (x * 36), 100 + (y * 52), 'breakout', `brick_${space}_1.png`);
            // brick.level = space;
            // brick.body.setRectangle(40, 40);
            // brick.body.bounce.set(1);
            brick.body.setCollisionGroup(brickCollisionGroup);
            brick.body.collides([ballCollisionGroup]);
            brick.body.setMaterial(material1);
            brick.body.kinematic = true;
            // brick.body.updateCollisionMask();
        })
    })

    paddle = game.add.sprite(game.world.centerX, 500, 'breakout', 'paddle_big.png');
    paddle.anchor.setTo(0.5, 0.5);
    game.physics.enable(paddle, Phaser.Physics.P2JS);
    paddle.body.collideWorldBounds = true;
    // paddle.body.bounce.set(1);
    paddle.body.setCollisionGroup(paddleCollisionGroup);
    paddle.body.collides([ballCollisionGroup]);
    paddle.body.setMaterial(material1);
    paddle.body.kinematic = true;
    paddle.velX = () => {
         return paddle.body.velocity.x;
     };
    paddle.body.updateCollisionMask();

    ball = game.add.sprite(game.world.centerX, paddle.y - 16, 'breakout', 'ball_1.png');
    ball.anchor.set(0.5);
    ball.smoothed = false;
    game.physics.p2.enable(ball, Phaser.Physics.P2JS);
    ball.checkWorldBounds = true;
    ball.body.collideWorldBounds = true;
    // ball.body.bounce.set(1);
    ball.body.setCollisionGroup(ballCollisionGroup);
    // ball.body.collides([paddleCollisionGroup, brickCollisionGroup]);
    ball.body.setMaterial(material2);
    // ball.body.maxVelocity.x = 1000;
    // ball.body.maxVelocity.y = 1000;
    ball.velX = () => {
         return ball.body.velocity.x
     };
    //  ball.body.damping = 0;
     ball.body.updateCollisionMask();

    ball.animations.add('spin', [ 'ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png' ], 50, true, false);

    ball.events.onOutOfBounds.add(ballLost, this);

    ball.body.collides([paddleCollisionGroup], ballHitPaddle, this);
    ball.body.collides([brickCollisionGroup], ballHitBrick, this);



    scoreText = game.add.text(32, 550, 'score: 0', { font: "20px Arial", fill: "#ffffff", align: "left" });
    introText = game.add.text(game.world.centerX, 400, '- click to start -', { font: "40px Arial", fill: "#ffffff", align: "center" });
    introText.anchor.setTo(0.5, 0.5);

    game.input.onDown.add(releaseBall, this);
}

function create() {

    //  Enable P2
    game.physics.startSystem(Phaser.Physics.P2JS);

    //  Turn on impact events for the world, without this we get no collision callbacks
    game.physics.p2.setImpactEvents(true);

    //  Create our collision groups. One for the player, one for the pandas
    var playerCollisionGroup = game.physics.p2.createCollisionGroup();
    var pandaCollisionGroup = game.physics.p2.createCollisionGroup();

    material1 = game.physics.p2.createMaterial();
    material2 = game.physics.p2.createMaterial();
    game.physics.p2.createContactMaterial(material1, material2, { friction: 0 , restitution: 1.0 });

    //  This part is vital if you want the objects with their own collision groups to still collide with the world bounds
    //  (which we do) - what this does is adjust the bounds to use its own collision group.
    game.physics.p2.updateBoundsCollisionGroup();

    var pandas = game.add.group();
    pandas.enableBody = true;
    pandas.physicsBodyType = Phaser.Physics.P2JS;

    brickSet.forEach((row, y) => {
        row.forEach((space, x) => {
            var panda = pandas.create(120 + (x * 36), 100 + (y * 52), 'breakout', `brick_${space}_1.png`);
            // panda.body.setRectangle(40, 40);

            //  Tell the panda to use the pandaCollisionGroup
            panda.body.setCollisionGroup(pandaCollisionGroup);

            //  Pandas will collide against themselves and the player
            //  If you don't set this they'll not collide with anything.
            //  The first parameter is either an array or a single collision group.
            panda.body.collides([pandaCollisionGroup, playerCollisionGroup]);
            panda.body.kinematic = true;
            panda.body.setMaterial(material1);
        });
    });


    //  Create our ship sprite
    ship = game.add.sprite(game.world.centerX, 500 - 16, 'breakout', 'ball_1.png');
    ship.anchor.set(0.5);
    ship.smoothed = false;
    // ship.animations.add('fly', [0,1,2,3,4,5], 10, true);
    ship.animations.add('spin', [ 'ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png' ], 50, true, false);
    // ship.play('spin');

    game.physics.p2.enable(ship, true);
    ship.checkWorldBounds = true;
    ship.body.collideWorldBounds = true;
    ship.body.setMaterial(material2);

    //  Set the ships collision group
    ship.body.setCollisionGroup(playerCollisionGroup);
    ship.body.velocity.x = -75;
    ship.body.velocity.y = -300;

    //  The ship will collide with the pandas, and when it strikes one the hitPanda callback will fire, causing it to alpha out a bit
    //  When pandas collide with each other, nothing happens to them.
    ship.body.collides(pandaCollisionGroup, hitPanda, this);

    game.camera.follow(ship);

    cursors = game.input.keyboard.createCursorKeys();

}

function hitPanda(body1, body2) {

    //  body1 is the space ship (as it's the body that owns the callback)
    //  body2 is the body it impacted with, in this case our panda
    //  As body2 is a Phaser.Physics.P2.Body object, you access its own (the sprite) via the sprite property:
    body2.sprite.kill();

}

function update() {

    // ship.body.setZeroVelocity();
    //
    // if (cursors.left.isDown)
    // {
    //     ship.body.moveLeft(200);
    // }
    // else if (cursors.right.isDown)
    // {
    //     ship.body.moveRight(200);
    // }
    //
    // if (cursors.up.isDown)
    // {
    //     ship.body.moveUp(200);
    // }
    // else if (cursors.down.isDown)
    // {
    //     ship.body.moveDown(200);
    // }

}



const paddleUnderBall = () => {
    return ball.x >= paddle.left && ball.x <= paddle.right
}

const ballLeftOfPaddle = () => {
    return ball.x < paddle.left
}

const ballRightOfPaddle = () => {
    return ball.x > paddle.left
}

const paddleGoingLeft = () => {
    return paddle.body.velocity.x < 0;
}

const paddleGoingRight = () => {
    return paddle.body.velocity.x > 0;
}

const ballGoingLeft = () => {
    return ball.body.velocity.x < 0;
}

const ballGoingRight = () => {
    return ball.body.velocity.x > 0;
}

const ballDistanceLeft = () => {
    // returning a negative number on purpose
    return ball.x - paddle.left;
}

const ballDistanceRight = () => {
    return ball.x - paddle.right;
}

const update2 = () => {
    if (!ballOnPaddle) {
        // let destination = ball.x;
        // if the ball is over the paddle, don't do anything, maybe add deceleration.
        let ballTravelled = ball.x - ball.lastX;
        console.log(ballTravelled);
        if (paddleUnderBall()) {
            // if(ballGoingLeft() && paddle.velX() < ball.velX()) {
            //     // paddle has caught up to the ball but is now going too fast
            //     paddle.body.velocity.x = paddle.body.velocity.x + paddleDeceleration;
            //     if (paddle.velX() > ball.velX()) {
            //         paddle.body.velocity.x = ball.velX()
            //     }
            // } else if (ballGoingRight() && paddle.velX() > ball.velX()) {
            //     // paddle has caught up to the ball but is now going too fast
            //     paddle.body.velocity.x = paddle.body.velocity.x - paddleDeceleration;
            //     if (paddle.velX() < ball.velX()) {
            //         paddle.body.velocity.x = ball.velX()
            //     }
            // }
            if(ballGoingLeft()) {
                paddle.body.x = ball.x + 12;
            } else if (ballGoingRight()) {
                paddle.body.x = ball.x - 12;
            }

        } else if (ballLeftOfPaddle()) {
            // paddle is to the right of the ball
            // distance = paddle.left = destination;
            // if (distance > maxPaddleSpeed) {
            //     distance = maxPaddleSpeed;
            // }
            // paddle.x = paddle.x - distance;
            if (paddleGoingRight()) {
                // going the wrong way
                paddle.body.velocity.x = paddle.body.velocity.x - paddleDeceleration;
                if (paddle.body.velocity.x < 0) {
                    paddle.body.velocity.x = 0;
                }
            } else if (paddle.body.velocity.x > (maxPaddleSpeed * -1)) {
                // need to check is the new velocity is going to put the paddle too far past the ball
                // used in cases of a very high acceleration
                let acceleration = paddleAcceleration;
                paddle.body.velocity.x = paddle.body.velocity.x - paddleAcceleration;
                if (paddle.body.velocity.x < maxPaddleSpeed * -1) {
                    paddle.body.velocity.x = maxPaddleSpeed
                }
                //don't accelerate much past the speed of the ball
                let paddleWillMove = paddle.body.velocity.x / 1000 * game.time.elapsedMS
                if(paddleWillMove < ballDistanceLeft() + ballFrameDistance) {
                    paddle.body.x += ballDistanceLeft() + ballFrameDistance - 8;
                    paddle.body.velocity.x = ball.body.velocity.x * 1.2
                }
            }
        } else if (ballRightOfPaddle()) {
            // paddle is to the left of the ball
            if (paddleGoingLeft()) {
                // going the wrong way
                paddle.body.velocity.x = paddle.body.velocity.x + paddleDeceleration;
                if (paddle.body.velocity.x > 0) {
                    paddle.body.velocity.x = 0;
                }
            } else if (paddle.body.velocity.x < maxPaddleSpeed) {
                // need to check is the new velocity is going to put the paddle too far past the ball
                // used in cases of a very high acceleration
                let acceleration = paddleAcceleration;
                paddle.body.velocity.x = paddle.body.velocity.x + paddleAcceleration;

                if (paddle.body.velocity.x > maxPaddleSpeed) {
                    paddle.body.velocity.x = maxPaddleSpeed
                }
                let paddleWillMove = paddle.body.velocity.x / 1000 * game.time.elapsedMS
                if(paddleWillMove > ballDistanceRight() + ballFrameDistance) {
                    paddle.body.x += ballDistanceRight() + ballFrameDistance + 8;
                    paddle.body.velocity.x = ball.body.velocity.x * 1.2
                }
            }

        }

        // // let destination = ball.x;
        // // if the ball is over the paddle, don't do anything, maybe add deceleration.
        // let ballFrameDistance = ball.velX() / 1000 * game.time.elapsedMS;
        // if (paddleUnderBall()) {
        //     // paddle.body.velocity.x = ball.body.velocity.y
        //     if(ballGoingLeft() && paddle.velX() < ball.velX()) {
        //         // paddle has caught up to the ball but is now going too fast
        //         // let valDiff = ball.velX() - paddle.velX();
        //         // let change = valDiff < paddleDeceleration ? valDiff : paddleDeceleration;
        //         // paddle.body.velocity.x = paddle.body.velocity.x + change;
        //         paddle.body.velocity.x = paddle.body.velocity.x + paddleDeceleration;
        //         if (paddle.velX() > ball.velX()) {
        //             paddle.body.velocity.x = ball.velX()
        //         }
        //     } else if (ballGoingRight() && paddle.velX() > ball.velX()) {
        //         // paddle has caught up to the ball but is now going too fast
        //         // let valDiff = paddle.body.velocity.x - ball.body.velocity.x;
        //         // let change = valDiff < paddleDeceleration ? valDiff : paddleDeceleration;
        //         // paddle.body.velocity.x = paddle.body.velocity.x - change;
        //         paddle.body.velocity.x = paddle.body.velocity.x - paddleDeceleration;
        //         if (paddle.velX() < ball.velX()) {
        //             paddle.body.velocity.x = ball.velX()
        //         }
        //     }
        // } else if (ballLeftOfPaddle()) {
        //     // paddle is to the right of the ball
        //     // distance = paddle.left = destination;
        //     // if (distance > maxPaddleSpeed) {
        //     //     distance = maxPaddleSpeed;
        //     // }
        //     // paddle.x = paddle.x - distance;
        //     if (paddleGoingRight()) {
        //         // going the wrong way
        //         // if (paddle.body.velocity.x < paddleDeceleration) {
        //             paddle.body.velocity.x = paddle.body.velocity.x - paddleDeceleration;
        //             if (paddle.body.velocity.x < 0) {
        //                 paddle.body.velocity.x = 0;
        //             }
        //         // } else {
        //         //     paddle.body.velocity.x = 0;
        //         // }
        //     } else if (paddle.body.velocity.x > (maxPaddleSpeed * -1)) {
        //         // need to check is the new velocity is going to put the paddle too far past the ball
        //         // used in cases of a very high acceleration
        //         let acceleration = paddleAcceleration;
        //         // if (paddleAcceleration < Math.abs(ball.body.velocity.x)) {
        //             paddle.body.velocity.x = paddle.body.velocity.x - paddleAcceleration;
        //         // } else {
        //             if (paddle.body.velocity.x < maxPaddleSpeed * -1) {
        //                 paddle.body.velocity.x = maxPaddleSpeed
        //             }
        //             //don't accelerate much past the speed of the ball
        //             let paddleWillMove = paddle.body.velocity.x / 1000 * game.time.elapsedMS
        //             if(paddleWillMove < ballDistanceLeft() + ballFrameDistance) {
        //                 paddle.body.x += ballDistanceLeft() + ballFrameDistance - 8;
        //                 paddle.body.velocity.x = ball.body.velocity.x * 1.2
        //             }
        //
        //         // }
        //     }
        // } else if (ballRightOfPaddle()) {
        //     // paddle is to the left of the ball
        //     // distance = destination - paddle.right;
        //     // if (distance > maxPaddleSpeed) {
        //     //     distance = maxPaddleSpeed;
        //     // }
        //     // paddle.x = paddle.x + distance;
        //     if (paddleGoingLeft()) {
        //         // going the wrong way
        //
        //         // if (paddle.body.velocity.x < paddleDeceleration) {
        //             paddle.body.velocity.x = paddle.body.velocity.x + paddleDeceleration;
        //             if (paddle.body.velocity.x > 0) {
        //                 paddle.body.velocity.x = 0;
        //             }
        //         // } else {
        //         //     paddle.body.velocity.x = 0;
        //         // }
        //     } else if (paddle.body.velocity.x < maxPaddleSpeed) {
        //         // need to check is the new velocity is going to put the paddle too far past the ball
        //         // used in cases of a very high acceleration
        //         let acceleration = paddleAcceleration;
        //         // if (paddleAcceleration < Math.abs(ball.body.velocity.x)) {
        //             paddle.body.velocity.x = paddle.body.velocity.x + paddleAcceleration;
        //
        //             if (paddle.body.velocity.x > maxPaddleSpeed) {
        //                 paddle.body.velocity.x = maxPaddleSpeed
        //             }
        //             let paddleWillMove = paddle.body.velocity.x / 1000 * game.time.elapsedMS
        //             if(paddleWillMove > ballDistanceRight() + ballFrameDistance) {
        //                 paddle.body.x += ballDistanceRight() + ballFrameDistance + 8;
        //                 paddle.body.velocity.x = ball.body.velocity.x * 1.2
        //             }
        //         // } else {
        //             //don't accelerate past the speed of the ball
        //             // paddle.body.velocity.x = ball.body.velocity.x * 1.2
        //         // }
        //
        //     }
        //
        // }

        // let distance = Math.abs(destination - paddle.x);
        // let direction = 1;
        // if (destination < paddle.x) {
        //     direction = -1;
        // }
        // if (distance > maxPaddleSpeed) {
        //     distance = maxPaddleSpeed;
        // }
        // paddle.x = paddle.x + (distance * direction);
    // let destination = ball.x;
    // if (destination >= paddle.left && destination <= paddle.right) {
    // } else {
    //     if (destination < paddle.left) {
    //         destination += paddle.width / 2;
    //     } else if (destination > paddle.right) {
    //         destination -= paddle.width / 2;
    //     }
    //     if ((paddle.x < ball.x && paddle.body.velocity.x < 0) || (paddle.x > ball.x && paddle.body.velocity.x > 0)) {
    //         game.physics.arcade.accelerateToXY(paddle, destination, paddle.y,2000,500,0);
    //     } else {
    //         game.physics.arcade.accelerateToXY(paddle, destination, paddle.y,500,500,0);
    //     }
    // }

    } else  {
        paddle.body.x = game.input.x;
    }

    // keep in bounds of the level
    if (paddle.body.x < 24)
    {
        paddle.body.x = 24;
        paddle.body.velocity.x = 0;
    }
    else if (paddle.body.x > game.width - 24)
    {
        paddle.body.x = game.width - 24;
        paddle.body.velocity.x = 0;
    }



    if (ball.body.needsVelocity) {
        ballVelocity = ballVelocity * ballRebound;
        // game.physics.arcade.velocityFromRotation(ball.body.angle, ballVelocity, ball.body.velocity);
        ball.body.needsVelocity = false;
    }

    if (ballOnPaddle)
    {
        ball.body.x = paddle.x;
    }
    else
    {
    }
    ball.lastX = ball.body.x;
}

const ballLost = () => {

    resetLevel();

}

const releaseBall = () => {

    if (ballOnPaddle)
    {
        ballOnPaddle = false;
        let point = new Phaser.Point();
        // game.physics.arcade.velocityFromAngle(getRandomInt(-135,-45), ballVelocity, point);
        console.log("point", point);
        ball.body.velocity.x = -75;
        ball.body.velocity.y = -300;
        ball.animations.play('spin');
        introText.visible = false;
    }

}

const ballHitBrick = (_ball, _brick) => {

    _brick.sprite.kill();

    _ball.needsVelocity = true;

    // var diff = 0;
    //
    // if (_ball.x < _brick.x)
    // {
    //     //  Ball is on the left-hand side of the paddle
    //     diff = _brick.x - _ball.x;
    //     _ball.body.velocity.x = (-10 * diff);
    // }
    // else if (_ball.x > _brick.x)
    // {
    //     //  Ball is on the right-hand side of the paddle
    //     diff = _ball.x -_brick.x;
    //     _ball.body.velocity.x = (10 * diff);
    // }
    // else
    // {
    //     //  Ball is perfectly in the middle
    //     //  Add a little random X to stop it bouncing straight up!
    //     _brick.body.velocity.x = 2 + Math.random() * 8;
    // }

    score += _brick.level * 10;

    scoreText.text = 'score: ' + score;

    //  Are they any bricks left?
    if (bricks.countLiving() == 0)
    {
        //  New level starts
        score += 1000;
        scoreText.text = 'score: ' + score;

        resetLevel();
    }

}

const ballHitPaddle = (_ball, _paddle) => {

    var diff = 0;
    if (_ball.x < _paddle.x)
    {
        //  Ball is on the left-hand side of the paddle
        diff = _paddle.x - _ball.x;
        _ball.velocity.x = (-20 * diff);
    }
    else if (_ball.x > _paddle.x)
    {
        //  Ball is on the right-hand side of the paddle
        diff = _ball.x -_paddle.x;
        _ball.velocity.x = (20 * diff);
    }
    else
    {
        //  Ball is perfectly in the middle
        //  Add a little random X to stop it bouncing straight up!
        _ball.velocity.x = 2 + Math.random() * 100;
    }

}

const resetLevel = () => {
    paddle.x = game.world.centerX
    paddle.y = 500
    paddle.body.velocity.x = 0;

    ball.x = game.world.centerX
    ball.y =  paddle.y - 16;

    ballVelocity = ballInitialVelocity;
    game.physics.arcade.velocityFromAngle(getRandomInt(-135,-45), ballVelocity, ball.body.velocity);

    //  And bring the bricks back from the dead :)
    bricks.callAll('revive');
}

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game-container', {
  preload: preload, create: create2, update: update2
});
