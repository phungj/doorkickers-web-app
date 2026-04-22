import { sim } from "./sim.js";
import {drawMap, map} from "./map.js";
import { createUnit, updateUnit, drawUnit, revealFromUnit } from "./unit.js";
import { setupInput } from "./input.js";
import {createFog, drawFog, FOG, getFogState, isVisibleToPlayer} from "./fog.js";
import {enemyBrain, playerBrain} from "./brains.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const world = {
    map,
    fog: createFog(map[0].length, map.length),
    units: []
}

const player = createUnit({x: 100, y: 50, dir: {x: 1, y: 0}, type: "player", brain: playerBrain});
const enemy = createUnit({x: 300, y: 50, dir: {x: -1, y: 0}, type: "enemy", brain: enemyBrain});

world.units.push(player);
world.units.push(enemy);


// TODO: Prevent enemy pathing through doors and walls
// TODO: Implementing contextual actions (e.g. opening a door nearby)
// TODO: Implementing floating actions (e.g. throwing a flashbang from anywhere)
// TODO: Shooting
// TODO: Edge of fog interactions like enemy silhouettes
// TODO: Raytracing door opening?
// TODO: Noise
// TODO: Enemy state machine
// TODO: Handle clipping of enemies when together
// TODO: Adjusting facing using right click
// TODO: Pie slicing with shift right click
// TODO: Strafing with control right click
setupInput(canvas, world);

function updateWorld(world) {
    for (const unit of world.units) {
        unit.brain?.(unit, world);
    }

    for (const unit of world.units) {
        updateUnit(unit, world);
    }

    for (const unit of world.units.filter(u => u.type === "player")) {
        revealFromUnit(unit, world.fog);
    }
}

function drawWorld(ctx, world) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMap(ctx);

    for (const unit of world.units) {
        if (unit.type === "enemy") {
            const state = getFogState(unit, world.fog);

            if (state === FOG.VISIBLE) {
                drawUnit(ctx, unit);
            } else if (state === FOG.SEEN) {
                // TODO: drawSilhouette(ctx, unit); // future
            }

            continue;
        }

        drawUnit(ctx, unit);
    }

    drawFog(ctx, world.fog);
}

function loop() {
    if (!sim.paused || sim.stepOnce) {
        updateWorld(world);
        sim.stepOnce = false;
    }

    drawWorld(ctx, world);
    requestAnimationFrame(loop);
}


loop();