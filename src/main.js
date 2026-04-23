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
    units: [],
    noiseEvents: [],
    ui: {
        contextMenu: null
    }
}

const player = createUnit({x: 100, y: 50, dir: {x: 1, y: 0}, type: "player", brain: playerBrain});
const enemy = createUnit({x: 300, y: 50, dir: {x: -1, y: 0}, type: "enemy", brain: enemyBrain});

world.units.push(player);
world.units.push(enemy);


// TODO: Fix right clicking in the middle of nowhere: make it so right clicking only does something when you click on a guy
// TODO: Look into action structure

// TODO: Possibly handle door aware pathfinding (contextual actions for AI)

// TODO: Implementing floating actions (e.g. throwing a flashbang from anywhere)
// TODO: Shooting
// TODO: Edge of fog interactions like enemy silhouettes
// TODO: Raytracing door opening?
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

    updateNoise(world);

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

    drawUI(ctx, world);
}

function updateNoise(world) {
    world.noiseEvents = world.noiseEvents.filter(n => {
        n.ttl--;
        return n.ttl > 0;
    });
}

export function drawUI(ctx, world) {
    const menu = world.ui.contextMenu;
    if (!menu) return;

    const padding = 10;
    const itemHeight = 22;
    const groupSpacing = 6;
    const width = 160;

    let yCursor = menu.y;

    ctx.font = "14px sans-serif";

    for (const group of menu.options) {
        // optional group spacing
        yCursor += groupSpacing;

        for (const opt of group) {
            // background row (optional highlight)
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(menu.x, yCursor, width, itemHeight);

            ctx.fillStyle = "white";
            ctx.fillText(
                opt.label,
                menu.x + padding,
                yCursor + 15
            );

            yCursor += itemHeight;
        }
    }
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