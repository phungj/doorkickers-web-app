import { sim } from "./sim.js";
import { drawMap, map } from "./map.js";
import { createUnit, updateUnit, drawUnit, revealFromUnit } from "./unit.js";
import { setupInput } from "./input.js";
import {createFog, drawFog} from "./fog.js";
import {enemyBrain, playerBrain} from "./brains.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const world = {
    map,
    fog: createFog(map[0].length, map.length),
    units: []
}

const player = createUnit(100, 50, "player", playerBrain);
const enemy = createUnit(300, 50, "enemy", enemyBrain);

world.units.push(player);
world.units.push(enemy);


// TODO: Implement a canSee function to ensure you and your enemies can only see what they see in a direction in front of them
// TODO: Hide enemies in the fog
// TODO: Also hide their paths

// TODO: Prevent pathing through doors and walls
// TODO: Implementing contextual actions
// TODO: Implementing floating actions
// TODO: Shooting
// TODO: Edge of fog interactions like enemy silhouettes
// TODO: Raytracing door opening?
// TODO: Noise
// TODO: Enemy state machine
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