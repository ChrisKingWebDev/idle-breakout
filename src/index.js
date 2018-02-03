require('pixi.js');
require('p2');
require('phaser');

var ball;
var paddle;
var bricks;
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
const create = () => {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.checkCollision.down = false;

    bricks = game.add.group();
    bricks.enableBody = true;
    bricks.physicsBodyType = Phaser.Physics.ARCADE;

    var brick;
    brickSet.forEach((row, y) => {
        row.forEach((space, x) => {
            brick = bricks.create(120 + (x * 36), 100 + (y * 52), 'breakout', `brick_${space}_1.png`);
            brick.level = space;
            brick.body.bounce.set(1);
            brick.body.immovable = true;
        })
    })

    paddle = game.add.sprite(game.world.centerX, 500, 'breakout', 'paddle_big.png');
    paddle.anchor.setTo(0.5, 0.5);
    game.physics.enable(paddle, Phaser.Physics.ARCADE);
    paddle.body.collideWorldBounds = false;
    paddle.body.bounce.set(1);
    paddle.body.immovable = true;
    paddle.velX = () => {
         return paddle.body.velocity.x;
     };

    ball = game.add.sprite(game.world.centerX, paddle.y - 16, 'breakout', 'ball_1.png');
    ball.anchor.set(0.5);
    ball.checkWorldBounds = true;
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    ball.body.collideWorldBounds = true;
    ball.body.bounce.set(1);
    // ball.body.maxVelocity.x = 1000;
    // ball.body.maxVelocity.y = 1000;
    ball.velX = () => {
         return ball.body.velocity.x
     };

    ball.animations.add('spin', [ 'ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png' ], 50, true, false);

    ball.events.onOutOfBounds.add(ballLost, this);

    scoreText = game.add.text(32, 550, 'score: 0', { font: "20px Arial", fill: "#ffffff", align: "left" });
    introText = game.add.text(game.world.centerX, 400, '- click to start -', { font: "40px Arial", fill: "#ffffff", align: "center" });
    introText.anchor.setTo(0.5, 0.5);

    game.input.onDown.add(releaseBall, this);
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

const update = () => {
    if (!ballOnPaddle) {
        // let destination = ball.x;
        // if the ball is over the paddle, don't do anything, maybe add deceleration.
        let ballFrameDistance = ball.velX() / 1000 * game.time.elapsedMS;
        if (paddleUnderBall()) {
            // paddle.body.velocity.x = ball.body.velocity.y
            if(ballGoingLeft() && paddle.velX() < ball.velX()) {
                // paddle has caught up to the ball but is now going too fast
                // let valDiff = ball.velX() - paddle.velX();
                // let change = valDiff < paddleDeceleration ? valDiff : paddleDeceleration;
                // paddle.body.velocity.x = paddle.body.velocity.x + change;
                paddle.body.velocity.x = paddle.body.velocity.x + paddleDeceleration;
                if (paddle.velX() > ball.velX()) {
                    paddle.body.velocity.x = ball.velX()
                }
            } else if (ballGoingRight() && paddle.velX() > ball.velX()) {
                // paddle has caught up to the ball but is now going too fast
                // let valDiff = paddle.body.velocity.x - ball.body.velocity.x;
                // let change = valDiff < paddleDeceleration ? valDiff : paddleDeceleration;
                // paddle.body.velocity.x = paddle.body.velocity.x - change;
                paddle.body.velocity.x = paddle.body.velocity.x - paddleDeceleration;
                if (paddle.velX() < ball.velX()) {
                    paddle.body.velocity.x = ball.velX()
                }
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
                // if (paddle.body.velocity.x < paddleDeceleration) {
                    paddle.body.velocity.x = paddle.body.velocity.x - paddleDeceleration;
                    if (paddle.body.velocity.x < 0) {
                        paddle.body.velocity.x = 0;
                    }
                // } else {
                //     paddle.body.velocity.x = 0;
                // }
            } else if (paddle.body.velocity.x > (maxPaddleSpeed * -1)) {
                // need to check is the new velocity is going to put the paddle too far past the ball
                // used in cases of a very high acceleration
                let acceleration = paddleAcceleration;
                // if (paddleAcceleration < Math.abs(ball.body.velocity.x)) {
                    paddle.body.velocity.x = paddle.body.velocity.x - paddleAcceleration;
                // } else {
                    if (paddle.body.velocity.x < maxPaddleSpeed * -1) {
                        paddle.body.velocity.x = maxPaddleSpeed
                    }
                    //don't accelerate much past the speed of the ball
                    let paddleWillMove = paddle.body.velocity.x / 1000 * game.time.elapsedMS
                    if(paddleWillMove < ballDistanceLeft() + ballFrameDistance) {
                        paddle.body.x += ballDistanceLeft() + ballFrameDistance - 8;
                        paddle.body.velocity.x = ball.body.velocity.x * 1.2
                    }

                // }
            }
        } else if (ballRightOfPaddle()) {
            // paddle is to the left of the ball
            // distance = destination - paddle.right;
            // if (distance > maxPaddleSpeed) {
            //     distance = maxPaddleSpeed;
            // }
            // paddle.x = paddle.x + distance;
            if (paddleGoingLeft()) {
                // going the wrong way

                // if (paddle.body.velocity.x < paddleDeceleration) {
                    paddle.body.velocity.x = paddle.body.velocity.x + paddleDeceleration;
                    if (paddle.body.velocity.x > 0) {
                        paddle.body.velocity.x = 0;
                    }
                // } else {
                //     paddle.body.velocity.x = 0;
                // }
            } else if (paddle.body.velocity.x < maxPaddleSpeed) {
                // need to check is the new velocity is going to put the paddle too far past the ball
                // used in cases of a very high acceleration
                let acceleration = paddleAcceleration;
                // if (paddleAcceleration < Math.abs(ball.body.velocity.x)) {
                    paddle.body.velocity.x = paddle.body.velocity.x + paddleAcceleration;

                    if (paddle.body.velocity.x > maxPaddleSpeed) {
                        paddle.body.velocity.x = maxPaddleSpeed
                    }
                    let paddleWillMove = paddle.body.velocity.x / 1000 * game.time.elapsedMS
                    if(paddleWillMove > ballDistanceRight() + ballFrameDistance) {
                        paddle.body.x += ballDistanceRight() + ballFrameDistance + 8;
                        paddle.body.velocity.x = ball.body.velocity.x * 1.2
                    }
                // } else {
                    //don't accelerate past the speed of the ball
                    // paddle.body.velocity.x = ball.body.velocity.x * 1.2
                // }

            }

        }

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
        paddle.x = game.input.x;
    }

    // keep in bounds of the level
    if (paddle.x < 24)
    {
        paddle.x = 24;
        paddle.body.velocity.x = 0;
    }
    else if (paddle.x > game.width - 24)
    {
        paddle.x = game.width - 24;
        paddle.body.velocity.x = 0;
    }



    if (ball.needsVelocity) {
        ballVelocity = ballVelocity * ballRebound;
        game.physics.arcade.velocityFromRotation(ball.body.angle, ballVelocity, ball.body.velocity);
        ball.needsVelocity = false;
    }

    if (ballOnPaddle)
    {
        ball.body.x = paddle.x;
    }
    else
    {
        game.physics.arcade.collide(ball, paddle, ballHitPaddle, null, this);
        game.physics.arcade.collide(ball, bricks, ballHitBrick, null, this);
    }
}

const ballLost = () => {

    resetLevel();

}

const releaseBall = () => {

    if (ballOnPaddle)
    {
        ballOnPaddle = false;
        game.physics.arcade.velocityFromAngle(getRandomInt(-135,-45), ballVelocity, ball.body.velocity);
        ball.animations.play('spin');
        introText.visible = false;
    }

}

const ballHitBrick = (_ball, _brick) => {

    _brick.kill();

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
        _ball.body.velocity.x = (-20 * diff);
    }
    else if (_ball.x > _paddle.x)
    {
        //  Ball is on the right-hand side of the paddle
        diff = _ball.x -_paddle.x;
        _ball.body.velocity.x = (20 * diff);
    }
    else
    {
        //  Ball is perfectly in the middle
        //  Add a little random X to stop it bouncing straight up!
        _ball.body.velocity.x = 2 + Math.random() * 100;
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
  preload: preload, create: create, update: update
});
