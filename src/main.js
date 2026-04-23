import {sim} from "./sim.js";
import {drawMap, map} from "./map.js";
import {createUnit, updateUnit, drawUnit, revealFromUnit, throwFlashbang} from "./unit.js";
import {setupInput} from "./input.js";
import {createFog, drawFog, FOG, getFogState} from "./fog.js";
import {enemyBrain, playerBrain} from "./brains.js";
import {FLASHBANG_DURATION, FLASHBANG_RADIUS, updateFlashbangs} from "./systems/throwables.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const world = {
    map,
    fog: createFog(map[0].length, map.length),
    units: [],
    events: {
        noise: [],
        flashbangs: [],
        impacts: []
    },
    ui: {
        contextMenu: null
    }
}

const player = createUnit({x: 100, y: 50, dir: {x: 1, y: 0}, type: "player", brain: playerBrain});
const enemy = createUnit({x: 300, y: 50, dir: {x: -1, y: 0}, type: "enemy", brain: enemyBrain});

world.units.push(player);
world.units.push(enemy);


// TODO: Add flashbang sfx
// TODO: Add gunshot sfx


// TODO: Shooting
// TODO: Add win check

// TODO: Adjusting facing using right click
// TODO: Pie slicing with shift right click
// TODO: Strafing with control right click

setupInput(canvas, world);

// TODO: Implement ability to breach and clear a door with a flashbang
// TODO: Debug flashbang throwing when paused
// TODO: Edge of fog interactions like enemy silhouettes
// TODO: Raytracing door opening?
// TODO: Add actual planning of some sort

function updateWorld(world, dt) {
    for (const unit of world.units) {
        unit.brain?.(unit, world);
    }

    resolvePendingActions(world);

    for (const unit of world.units) {
        updateUnit(unit, world);
    }

    updateNoise(world);
    updateFlashbangs(world, dt);

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
    for (const unit of world.units) {
        const action = unit.pendingAction;

        if (!action || action.type !== "flashbang" || !action.target) continue;

        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;

        // line
        ctx.beginPath();
        ctx.moveTo(action.origin.x, action.origin.y);
        ctx.lineTo(action.target.x, action.target.y);
        ctx.stroke();

        // radius
        ctx.strokeStyle = "rgba(255,255,0,0.3)";
        ctx.beginPath();
        ctx.arc(action.target.x, action.target.y, FLASHBANG_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    }

    for (const fb of world.events.flashbangs) {
        drawFlashbang(ctx, fb);
    }
}

function resolvePendingActions(world) {
    for (const unit of world.units) {
        const action = unit.pendingAction;
        if (!action || !action.target || !action.confirmed) continue;

        switch (action.type) {
            case "flashbang":
                throwFlashbang(world, action.origin, action.target);
                break;
        }

        action.resolved = true;
    }
}

function cleanupActions(world) {
    for (const unit of world.units) {
        if (unit.pendingAction?.resolved) {
            unit.pendingAction = null;
        }
    }
}

// TODO: Render this with LOS considerations
function drawFlashbang(ctx, fb) {
    if (fb.detonated) {
        // explosion (keep your existing code)
        const now = performance.now();
        const t = (fb.expiryTime - now) / FLASHBANG_DURATION;
        const alpha = Math.max(0, Math.min(1, t));

        const progress = 1 - alpha;
        const radius = fb.radius * (1 + progress * 0.3);

        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        return;
    }

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, 3, 0, Math.PI * 2);
    ctx.fill();
}

let lastTime = performance.now();

function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;

    if (!sim.paused || sim.stepOnce) {
        updateWorld(world, dt);
        sim.stepOnce = false;
    }

    drawWorld(ctx, world);
    requestAnimationFrame(loop);
}


loop();