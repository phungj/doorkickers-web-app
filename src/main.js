import { sim } from "./sim.js";
import { drawMap, map } from "./map.js";
import { createUnit, updateUnit, drawUnit, revealFromUnit } from "./unit.js";
import { setupInput } from "./input.js";
import {createFog, drawFog} from "./fog.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const unit = createUnit(100, 50);

const fog = createFog(map[0].length, map.length);

setupInput(canvas, unit);

function update() {
    updateUnit(unit);

    revealFromUnit(unit, fog);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMap(ctx);
    drawUnit(ctx, unit);
    drawFog(ctx, fog);
}

function loop() {
    if (!sim.paused || sim.stepOnce) {
        update();
        sim.stepOnce = false;
    }

    draw();
    requestAnimationFrame(loop);
}

loop();