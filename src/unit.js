import { getTileAt, openDoorAt, Tile, TILE_SIZE } from "./map.js";
import { FOG, idx } from "./fog.js";
import { hasLineOfSight } from "./los.js";

const ActionType = {
    MOVE: "move",
    OPEN_DOOR: "openDoor"
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

export function createUnit(x, y) {
    return {
        x,
        y,
        dir: {x: 1, y: 0},
        size: 15,
        visionRange: 100,
        rawPath: [],
        waypoints: [],
        targetIndex: 0
    };
}

export function updateUnit(unit) {
    if (!hasActiveWaypoint(unit)) return;

    const wp = getCurrentWaypoint(unit);

    const arrived = stepTowardWaypoint(unit, wp);

    if (!arrived) return;

    handleWaypointArrival(unit, wp);
    advanceWaypoint(unit);
}

export function drawUnit(ctx, unit) {
    ctx.fillStyle = "cyan";
    ctx.fillRect(
        unit.x - unit.size / 2,
        unit.y - unit.size / 2,
        unit.size,
        unit.size
    );

    const target = unit.waypoints?.[unit.targetIndex];
    if (target) {
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const len = Math.hypot(dx, dy);

        if (len > 0.0001) {
            unit.dir.x = dx / len;
            unit.dir.y = dy / len;
        }
    }

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

            const dx = worldX - unit.x;
            const dy = worldY - unit.y;

            const dist = Math.hypot(dx, dy);
            if (dist === 0) continue;

            if (dist > unit.visionRange) continue;

            const ndx = dx / dist;
            const ndy = dy / dist;

            // TODO: Tune this
            const FOV_ANGLE = Math.PI / 3;
            const cosHalfAngle = Math.cos(FOV_ANGLE / 2);


            const dot = ndx * unit.dir.x + ndy * unit.dir.y;
            if (dot < cosHalfAngle) continue;

            if (!withinVision(unit, worldX, worldY)) continue;

            if (!hasLineOfSight(unit.x, unit.y, worldX, worldY)) continue;

            fog.cells[idx(fog, x, y)] = FOG.VISIBLE;
        }
    }
}

function annotateWaypoints(waypoints) {
    for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i];

        const tile = getTileAt(wp.x, wp.y);

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

        const tile = getTileAt(x, y);

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
    const speed = 2;

    if (dist < speed) {
        unit.x = wp.x;
        unit.y = wp.y;
        return true;
    }

    const nextX = unit.x + (dx / dist) * speed;
    const nextY = unit.y + (dy / dist) * speed;

    unit.x = nextX;
    unit.y = nextY;

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

function withinVision(unit, worldX, worldY) {
    const dx = worldX - unit.x;
    const dy = worldY - unit.y;

    return Math.hypot(dx, dy) <= unit.visionRange;
}