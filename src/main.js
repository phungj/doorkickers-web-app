import { sim } from "./sim.js";
import {drawMap, map} from "./map.js";
import {createUnit, updateUnit, drawUnit, revealFromUnit, throwFlashbang} from "./unit.js";
import { setupInput } from "./input.js";
import {createFog, drawFog, FOG, getFogState} from "./fog.js";
import {enemyBrain, playerBrain} from "./brains.js";
import {updateFlashbangs} from "./systems/throwables.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const world = {
    map,
    fog: createFog(map[0].length, map.length),
    units: [],
    events: {
        noise: [],
        flashbangs: []
    },
    ui: {
        contextMenu: null
    }
}

const player = createUnit({x: 100, y: 50, dir: {x: 1, y: 0}, type: "player", brain: playerBrain});
const enemy = createUnit({x: 300, y: 50, dir: {x: -1, y: 0}, type: "enemy", brain: enemyBrain});

world.units.push(player);
world.units.push(enemy);

// TODO: Have throwing flashbangs deal with walls
// TODO: have flashbangs deal with los
// TODO: Add flashbang sfx
// TODO: Implement ability to breach and clear a door with a flashbang
// TODO: Debug flashbang throwing when paused

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

    resolvePendingActions(world);

    for (const unit of world.units) {
        updateUnit(unit, world);
    }

    updateNoise(world);
    updateFlashbangs(world);

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

    drawOverlays(ctx, world);
    drawUI(ctx, world);

    cleanupActions(world);
}

function updateNoise(world) {
    world.events.noise = world.events.noise.filter(n => {
        n.ttl--;
        return n.ttl > 0;
    });
}

// TODO: Handle drawing an empty menu or otherwise indicating that it's empty
export function drawUI(ctx, world) {
    const menu = world.ui.contextMenu;
    if (!menu) return;

    const padding = 10;
    const itemHeight = 22;
    const width = 160;

    let yCursor = menu.y;

    ctx.font = "14px sans-serif";

    for (const opt of menu.options) {
        // background
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(menu.x, yCursor, width, itemHeight);

        // text
        ctx.fillStyle = "white";
        ctx.fillText(
            opt.label,
            menu.x + padding,
            yCursor + 15
        );

        yCursor += itemHeight;
    }
}

// TODO: Refactor this to work with multiple units
// TODO: Figure out how to remove these eventually
export function drawOverlays(ctx, world) {
    for (const fb of world.events.flashbangs) {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(fb.origin.x, fb.origin.y);
        ctx.lineTo(fb.x, fb.y);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255,255,0,0.3)";
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function resolvePendingActions(world) {
    for (const unit of world.units) {
        const action = unit.pendingAction;
        if (!action || !action.target) continue;

        switch (action.type) {
            case "flashbang":
                throwFlashbang(world, action.origin, action.target);
        }
    }
}

function cleanupActions(world) {
    for (const unit of world.units) {
        if (unit.pendingAction?.target) {
            unit.pendingAction = null;
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