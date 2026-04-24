import { getTileWorld, openDoorAt, Tile, TILE_SIZE } from "./map.js";
import { FOG, idx } from "./fog.js";
import {canSee} from "./los.js";
import {FLASHBANG_MAX_RANGE, FLASHBANG_RADIUS} from "./systems/throwables.js";

const MAX_HP = 100;

const ActionType = {
    MOVE: "move",
    OPEN_DOOR: "openDoor"
}

const States = {
    IDLE: "idle",
    CHASE: "chase",
    SEARCH: "search"
}

// type Waypoint = {
//     x: number,
//     y: number,
//
//     // movement happens here
//     move: true,
//
//     // optional behavior
//     action?: {
//         type: string,
//         target?: { x, y }
//     },
//
//     wait?: number
// };

// TODO: Tune vision range (possibly just make infinite?)
// TODO: Implement ammo and reloading
export function createUnit({id,
                               x,
                               y,
                               dir,
                               type,
                               brain
                           }) {
    const len = Math.hypot(dir.x, dir.y);

    const finalDir = (len > 0)
        ? { x: dir.x / len, y: dir.y / len }
        : { x: 1, y: 0 };

    return {
        id,
        x,
        y,
        dir: finalDir,
        size: 15,
        visionRange: 100,
        speed: 2,
        hp: MAX_HP,
        weapon: {
            cooldown: 0,
            fireRate: 3
        },
        alive: true,
        rawPath: [],
        waypoints: [],
        targetIndex: 0,
        type,
        brain,
        state: States.IDLE,
        lastSeen: null,
        stateTimer: 0,
        currentGoal: null,
        blindedUntil: 0,
        deafUntil: 0
    };
}

// TODO: Handle clipping of enemies when together?
export function updateUnit(unit, world) {
    if (!unit.alive) return;
    if (!hasActiveWaypoint(unit)) return;

    const wp = getCurrentWaypoint(unit);

    const arrived = stepTowardWaypoint(unit, wp);

    if (!arrived) return;

    handleWaypointArrival(unit, wp);
    advanceWaypoint(unit);
}

export function drawUnit(ctx, unit) {
    if (!unit.alive) {
        ctx.fillStyle = "#555";
    } else if (unit.type === "enemy") {
        ctx.fillStyle = getEnemyColor(unit);
    } else {
        ctx.fillStyle = "cyan";
    }

    const hpRatio =
        unit.alive && unit.hp != null && MAX_HP
            ? Math.max(0, unit.hp / MAX_HP)
            : 0;

    const fillHeight = unit.size * hpRatio;
    const topY = unit.y + (unit.size - fillHeight);

    ctx.save();

    // clip to remaining HP region
    ctx.beginPath();
    ctx.rect(unit.x, topY, unit.size, fillHeight);
    ctx.clip();

    ctx.fillRect(unit.x, unit.y, unit.size, unit.size);

    ctx.restore();

    if (unit.type === "player") {
        if (unit.rawPath && unit.rawPath.length > 1) {
            ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
            ctx.beginPath();

            ctx.moveTo(unit.rawPath[0].x, unit.rawPath[0].y);

            for (let i = 1; i < unit.rawPath.length; i++) {
                const p = unit.rawPath[i];
                ctx.lineTo(p.x, p.y);
            }

            ctx.stroke();
        }

        if (unit.waypoints && unit.waypoints.length > 0) {
            // Path line
            ctx.strokeStyle = "yellow";
            ctx.beginPath();

            ctx.moveTo(unit.x, unit.y);

            for (let i = unit.targetIndex; i < unit.waypoints.length; i++) {
                const p = unit.waypoints[i];
                ctx.lineTo(p.x, p.y);
            }

            ctx.stroke();

            for (let i = 0; i < unit.waypoints.length; i++) {
                const p = unit.waypoints[i];

                // Current target = red, others = white
                ctx.fillStyle = (i === unit.targetIndex) ? "red" : "white";

                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const facingLength = 10;

        ctx.strokeStyle = "cyan";
        ctx.beginPath();
        ctx.moveTo(unit.x, unit.y);
        ctx.lineTo(
            unit.x + unit.dir.x * facingLength,
            unit.y + unit.dir.y * facingLength
        );
        ctx.stroke();
    }
}

function getEnemyColor(unit) {
    const now = performance.now();

    if (unit.blindedUntil && now < unit.blindedUntil) {
        return "white";
    }

    return "red";
}

export function simplifyPath(points) {
    if (points.length === 0) return [];

    const waypoints = [];
    let last = points[0];
    waypoints.push({ x: last.x, y: last.y });

    for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const dx = p.x - last.x;
        const dy = p.y - last.y;

        if (Math.hypot(dx, dy) > 20 && isLineWalkable(last.x, last.y, p.x, p.y)) {
            waypoints.push({ x: p.x, y: p.y });
            last = p;
        }
    }

    annotateWaypoints(waypoints);

    return waypoints;
}

export function revealFromUnit(unit, fog) {
    const radius = Math.ceil(unit.visionRange / TILE_SIZE);

    const cx = Math.floor(unit.x / TILE_SIZE);
    const cy = Math.floor(unit.y / TILE_SIZE);

    fadeFog(fog);

    for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            if (!inBounds(fog, x, y)) continue;

            const worldX = x * TILE_SIZE + TILE_SIZE / 2;
            const worldY = y * TILE_SIZE + TILE_SIZE / 2;

            if (!canSee(unit, worldX, worldY)) continue;

            fog.cells[idx(fog, x, y)] = FOG.VISIBLE;
        }
    }

    fog.cells[idx(fog, cx, cy)] = FOG.VISIBLE;
}

function annotateWaypoints(waypoints) {
    for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i];

        const tile = getTileWorld(wp.x, wp.y);

        if (tile === Tile.DOOR_CLOSED) {
            wp.action = { type: "openDoor" };
        }
    }
}

function isLineWalkable(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;

    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x0 + dx * t;
        const y = y0 + dy * t;

        const tile = getTileWorld(x, y);

        if (tile === Tile.WALL) {
            return false;
        }
    }

    return true;
}

function handleAction(unit, action) {
    switch (action.type) {
        case "openDoor":
            executeOpenDoor(unit);
            break;
    }
}

function hasActiveWaypoint(unit) {
    return (
        unit.waypoints.length > 0 &&
        unit.targetIndex < unit.waypoints.length
    );
}

function getCurrentWaypoint(unit) {
    return unit.waypoints[unit.targetIndex];
}

function advanceWaypoint(unit) {
    unit.targetIndex++;
}

function handleWaypointArrival(unit, wp) {
    if (wp.action) {
        handleAction(unit, wp.action);
    }
}

function stepTowardWaypoint(unit, wp) {
    const dx = wp.x - unit.x;
    const dy = wp.y - unit.y;

    const dist = Math.hypot(dx, dy);

    if (dist <= 0.0001) {
        unit.x = wp.x;
        unit.y = wp.y;
        return true;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    unit.dir.x = nx;
    unit.dir.y = ny;

    if (dist <= unit.speed) {
        unit.x = wp.x;
        unit.y = wp.y;
        return true;
    }

    unit.x += nx * unit.speed;
    unit.y += ny * unit.speed;

    return false;
}

// TODO: Add a delay to doing this
function executeOpenDoor(unit) {
    openDoorAt(unit.x, unit.y);
}

function fadeFog(fog) {
    for (let i = 0; i < fog.cells.length; i++) {
        if (fog.cells[i] === FOG.VISIBLE) {
            fog.cells[i] = FOG.SEEN;
        }
    }
}

function inBounds(fog, x, y) {
    return x >= 0 && y >= 0 && x < fog.width && y < fog.height;
}

export function getNearbyInteractables(player, world) {
    const range = TILE_SIZE;

    const results = [];

    const cx = Math.floor(player.x / TILE_SIZE);
    const cy = Math.floor(player.y / TILE_SIZE);

    const radius = 2; // small grid radius is enough for now

    for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            const tile = world.map?.[y]?.[x];
            if (tile === Tile.DOOR_CLOSED) {
                const wx = x * TILE_SIZE + TILE_SIZE / 2;
                const wy = y * TILE_SIZE + TILE_SIZE / 2;

                const dx = wx - player.x;
                const dy = wy - player.y;

                // TODO: Implement door closing contextual action
                if (Math.hypot(dx, dy) <= range) {
                    results.push({
                        type: "door",
                        x,
                        y,
                        worldX: wx,
                        worldY: wy,
                        actions: [
                            {label: "Open Door", fn: () => openDoorAt(wx, wy)}
                        ]
                    });
                }
            }
        }
    }

    return results;
}

// TODO: Limit flashbangs somehow, probably give units inventories
export function getGlobalActions(unit, world) {
    return [
        {
            label: "Throw Flashbang",
            fn: () => {
                unit.pendingAction = {
                    type: "flashbang",
                    origin: { x: unit.x, y: unit.y },
                    target: null,
                    confirmed: false,
                    resolved: false
                };
            }
        }
    ];
}

// TODO: tune this
// TODO: Possible time refactoring
export function throwFlashbang(world, origin, target) {
    const now = performance.now();

    let dx = target.x - origin.x;
    let dy = target.y - origin.y;

    let dist = Math.hypot(dx, dy);

    if (dist > FLASHBANG_MAX_RANGE) {
        const scale = FLASHBANG_MAX_RANGE / dist;

        dx *= scale;
        dy *= scale;

        dist = FLASHBANG_MAX_RANGE;

        target = {
            x: origin.x + dx,
            y: origin.y + dy
        };
    }

    const speed = 600; // px/sec
    const travelDuration = dist / speed;

    const vx = dx / travelDuration;
    const vy = dy / travelDuration;

    world.events.flashbangs.push({
        origin: { ...origin },
        target,

        x: origin.x,
        y: origin.y,

        vx,
        vy,

        startTime: now,
        travelDuration: travelDuration * 1000,

        detonationTime: now + travelDuration * 1000,
        expiryTime: now + travelDuration * 1000 + 200,

        radius: FLASHBANG_RADIUS,

        effect: {
            blindDuration: 3000,
            deafDuration: 3000
        },

        detonated: false
    });
}
