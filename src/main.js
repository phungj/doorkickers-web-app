import { drawMap } from "./map.js";
import { createUnit, updateUnit, drawUnit } from "./unit.js";
import { setupInput } from "./input.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const unit = createUnit(100, 50);

setupInput(canvas, unit);

function update() {
    updateUnit(unit);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMap(ctx);
    drawUnit(ctx, unit);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();