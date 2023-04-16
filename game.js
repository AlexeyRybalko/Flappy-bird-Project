const canvas = document.getElementById('mycanvas');
const ctx = canvas.getContext('2d');

const sprite = new Image();
sprite.src = "img/sprite.png";

const scoreSound = new Audio();
scoreSound.src = "sound/sfx_point.wav";

const dieSound = new Audio();
dieSound.src = "sound/sfx_die.wav";

const flapSound = new Audio();
flapSound.src = "sound/sfx_flap.wav";

const hitSound = new Audio();
hitSound.src = "sound/sfx_hit.wav";

const swooshSound = new Audio();
swooshSound.src = "sound/sfx_swooshing.wav";

let frames = 0;

//Состояние игры
const state = {
    current : 0,
    getReady : 0,
    game : 1,
    gameOver : 2,
};

//Координаты кнопки Старт
const startBtn = {
    x : 120,
    y : 263,
    h : 29,
    w : 83,
};

//Угол поворота из градусов в радианы
const degree = Math.PI/180;

canvas.addEventListener('click', function(event){
    switch (state.current) {
        case state.getReady:
            state.current = state.game;
            swooshSound.play();            
            break;
        case state.game:
            bird.flap();
            flapSound.play();            
            break;
        case state.gameOver:
            let rect = canvas.getBoundingClientRect();
            let clickX = event.clientX - rect.left;
            let clickY = event.clientY - rect.top;

            //Проверка нажатия кнопки Старт
            if(clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w &&
               clickY >= startBtn.y && clickY <= startBtn.y + startBtn.h){
                pipes.reset();
                bird.speedReset();
                score.reset();
                state.current = state.getReady;  
               }          
            break;
    }
});

//Управление на кнопку "пробел"
document.addEventListener('keydown', function(event){
    if(state.current == state.game){
        if(event.code = 'space'){
            bird.flap();
            flapSound.play(); 
        }
    }
});

//Задний фон
const bg = {
    //sourceX, sourceY
    sX : 0,
    sY : 0,
    //width, height
    w : 275,
    h : 226,
    x : 0, 
    y : canvas.height - 226,
    //скорость движения
    dx : 0.2,

    draw : function(){
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);

        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    },

    //Смещение фона влево до достижения позиции w/2, тогда координата становится равной 0 снова.
    update : function(){
        if(state.current == state.game){
            this.x = (this.x - this.dx) % (this.w/2);
        };
    },
};

//Передний фон (земля)
const fg = {
    sX : 276,
    sY : 0,
    w : 224,
    h : 112,
    x : 0,
    y : canvas.height - 112,
    dx : 1,

    draw : function(){
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);

        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    },

    update : function(){
        if(state.current == state.game){
            this.x = (this.x - this.dx) % (this.w/2);
        }
    },
};

const bird = {
    //Анимация взмахов крыльями
    animation : [
        {sX: 276, sY: 114},
        {sX: 276, sY: 140},
        {sX: 276, sY: 166},
        {sX: 276, sY: 140},
    ],

    x : 50,
    y : 150,
    w : 34,
    h : 26,

    frame : 0,

    speed : 0,
    gravity : 0.05,
    jump : 2.0,
    rotation : 0,
    radius : 12,
    
    draw : function(){
        let bird = this.animation[this.frame];

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(sprite, bird.sX, bird.sY, this.w, this.h, - this.w/2, - this.h/2, this.w, this.h);
    
        ctx.restore();
    },
    
    flap : function(){
       this.speed = - this.jump;
    },

    update : function(){
        // Частота взмахов крыльями. Если текущая стадия - подготовка, то
        // промежуток времени 10, иначе - 5. 
        this.period = state.current == state.getReady ? 20 : 10;
        // Увеличиваем индекс на 1, каждый промежуток времени.
        this.frame += frames % this.period == 0 ? 1 : 0;
        // Зацикливаем индекс массива 0%4=0, 1%4=1, 2%4=2, 3%4=3, 4%4=0.
        this.frame = this.frame % this.animation.length;

        if(state.current == state.getReady){
            this.y = 150; //сброс позиции птички
            this.rotation = 0 * degree;
        }else{
            this.speed += this.gravity;
            this.y += this.speed;

            //Условие столкновения с землей
            if(this.y + this.h/2 >= canvas.height - fg.h){
                this.y = canvas.height - fg.h - this.h/2;
                if(state.current == state.game){
                    state.current = state.gameOver;
                    dieSound.play();
                };
            };

            //Условие столкновения с
            if(this.y - this.h/2 <= 0){
                this.y = 0 + this.h/2
            };

            // Если speed больше чем jump - значит птичка падает
            if(this.speed >= this.jump){
                this.rotation = 90 * degree;
                this.frame = 1;
            }else{
                this.rotation = -25 * degree;
            }
        };
    },

    speedReset : function(){
        this.speed = 0;
    },
};

const pipes = {
    position : [],

    top : {
        sX: 553,
        sY : 0,
    },
    bottom : {
        sX : 502,
        sY : 0,
    },

    w: 53,
    h : 400,
    gap: 100,
    maxYpos : - 150,
    dx : 1,

    draw : function(){
        for(let i = 0;  i < this.position.length; i++){
            let p = this.position[i];

            let topYPos = p.y;
            let bottomYPOs = p.y + this.h + this.gap;

            //верхняя труба
            ctx.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, p.x, topYPos, this.w, this.h);

            //нижняя труба
            ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYPOs, this.w, this.h);
        }
    },

    update : function(){
        if(state.current !== state.game) return;

        if(frames % 200 == 0){
            this.position.push({
                x : canvas.width,
                y : this.maxYpos * (Math.random() + 1),
            });
        }
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];

            p.x -= this.dx;
            let bottomPipeYPos = p.y + this.h + this.gap;

            //Определение столкновения
            //Верхняя труба
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && 
               bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h){
                state.current = state.gameOver;
                hitSound.play();
               };

            //Нижняя труба
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && 
               bird.y + bird.radius > bottomPipeYPos && bird.y - bird.radius < bottomPipeYPos + this.h){
                state.current = state.gameOver;
                hitSound.play();
               }
            
            //Удаление первой трубы из массива, когда она выходит за левую границу канваса
            if((p.x + this.w) <= 0){
                this.position.shift();
                score.value += 1;
                scoreSound.play();
                score.best = Math.max(score.value, score.best);
                localStorage.setItem("best", score.best);
            }
        }
    },

    reset : function(){
       this.position = []; 
    },
};

const getReady = {
    sX : 0,
    sY : 228,
    w : 173,
    h : 152,
    x : canvas.width/2 - 173/2,
    y : 80,

    draw : function(){
        if(state.current == state.getReady){
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
};

const gameOver = {
    sX : 175,
    sY : 228,
    w : 225,
    h : 202,
    x : canvas.width/2 - 225/2,
    y : 90,

    draw : function(){
        if(state.current == state.gameOver){
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
};

const score = {
    best : parseInt(localStorage.getItem("best")) || 0,
    value : 0,

    draw : function(){
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";

        if(state.current == state.game){
            ctx.lineWidth = 2;
            ctx.font = "35px Teko";
            ctx.fillText(this.value, canvas.width/2, 50);
            ctx.strokeText(this.value, canvas.width/2, 50);
        }else if(state.current == state.gameOver){
            //Набранные очки
            ctx.font = "25px Teko";
            ctx.fillText(this.value, 225, 186);
            ctx.strokeText(this.value, 225, 186);
            //Лучший результат
            ctx.fillText(this.best, 225, 228);
            ctx.strokeText(this.best, 225, 228);
        }
    },

    reset : function(){
        this.value = 0;
    },
};

//Вызов методов отрисовки
function draw(){
    //Очистка поля канваса
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    getReady.draw();
    gameOver.draw();
    score.draw();
};

//Вызов методов обновления объектов
function update(){
    bird.update();
    fg.update();
    bg.update();
    pipes.update();
};

function loop(){
    update();
    draw();
    frames++;

    requestAnimationFrame(loop);
};

loop();
