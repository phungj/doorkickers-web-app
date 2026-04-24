import {canSee} from "./los.js";
import { aStar } from "./systems/pathfinding.js";
import {simplifyPath} from "./unit.js";
import {tryShoot} from "./systems/combat.js";

const EVENT_PRIORITY = {
    vision: 100,
    gunshot: 75,
    noise: 50
};

const stateFunctions = {
    idle: idleState,
    chase: chaseState,
    search: searchState
};

export function playerBrain(unit, world) {
    if (!unit.alive) return;

    const target = findVisibleTarget(unit, world);
    if (!target) return;

    faceTarget(unit, target.x, target.y);
    tryShoot(unit, target, world);
}

// TODO: enemy memory?
// TODO: Implement just choosing to look vs move somewhere?
// TODO: Make AI smarter when you eventually implement things like cover or grenades
export function enemyBrain(unit, world) {
    const prevState = unit.state;

    const events = buildEventQueue(unit, world);
    const topEvent = events[0];

    if (topEvent?.type === "vision") {
        unit.state = "chase";
        unit.lastSeen = {
            id: topEvent.data.id,
            x: topEvent.data.x,
            y: topEvent.data.y
        };
    } else if (topEvent?.type === "noise" && unit.state !== "chase") {
        unit.state = "search";
        unit.lastSeen = {
            id: topEvent.data.id,
            x: topEvent.data.x,
            y: topEvent.data.y
        };
    }

    const target = resolveTarget(unit, world);

    if (unit.state === "chase" && !target) {
        unit.state = "idle";
    }

    if (unit.state === "search" && !unit.lastSeen) {
        unit.state = "idle";
    }

    if (unit.state !== prevState) {
        unit.currentGoal = null;
    }

    stateFunctions[unit.state](unit, world);
}

function buildEventQueue(unit, world) {
    const events = [];

    const target = findVisibleTarget(unit, world);
    if (target) {
        events.push({
            type: "vision",
            priority: EVENT_PRIORITY.vision,
            data: target
        });
    }

    const noise = hearNoise(unit, world);
    if (noise) {
        events.push({
            type: "noise",
            priority: EVENT_PRIORITY.noise,
            data: noise
        });
    }

    // highest priority first
    events.sort((a, b) => b.priority - a.priority);

    return events;
}

function idleState(unit, world) {
    // optional wandering later
}

// TODO: Handle omniscient ai here
function chaseState(unit, world) {
    const target = resolveTarget(unit, world);
    if (!target) return;

    const visibleTarget = findVisibleTarget(unit, world);

    if (visibleTarget) {
        faceTarget(unit, target.x, target.y);
        tryShoot(unit, visibleTarget, world);

        return;
    }

    const needsNewPath =
        !unit.currentGoal ||
        Math.hypot(unit.currentGoal.x - target.x, unit.currentGoal.y - target.y) > 10;

    if (needsNewPath) {
        unit.currentGoal = { x: target.x, y: target.y };

        const rawPath = aStar(unit, target);

        unit.waypoints = simplifyPath(rawPath);
        unit.targetIndex = 0;
    }
}

function searchState(unit, world) {
    const target = resolveTarget(unit, world);
    if (!target) return;

    const visibleTarget = findVisibleTarget(unit, world);
    if (visibleTarget) {
        faceTarget(unit, target.x, target.y);
        tryShoot(unit, visibleTarget, world);
    }

    const needsNewPath =
        !unit.currentGoal ||
        Math.hypot(unit.currentGoal.x - target.x, unit.currentGoal.y - target.y) > 10;

    if (needsNewPath) {
        unit.currentGoal = { x: target.x, y: target.y };

        const rawPath = aStar(unit, target);

        unit.waypoints = simplifyPath(rawPath);
        unit.targetIndex = 0;
    }

    // arrival logic (unchanged conceptually)
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;

    if (Math.hypot(dx, dy) < 10) {
        unit.lastSeen = null;
        unit.currentGoal = null;
        unit.state = "idle";
    }
}

function findVisibleTarget(unit, world) {
    let closest = null;
    let closestDist = Infinity;

    for (const u of world.units) {
        if (u.type === unit.type) continue;
        if (!u.alive) continue;

        if (!canSee(unit, u.x, u.y, world)) continue;

        const dx = u.x - unit.x;
        const dy = u.y - unit.y;
        const dist = Math.hypot(dx, dy);

        if (dist < closestDist) {
            closestDist = dist;
            closest = u;
        }
    }

    return closest;
}


// TODO: Noise prioritization can be added here
function hearNoise(unit, world) {
    let best = null;
    let bestDist = Infinity;

    for (const n of world.events.noise) {
        const dx = n.x - unit.x;
        const dy = n.y - unit.y;
        const dist = Math.hypot(dx, dy);

        if (dist > n.radius) continue;

        if (dist < bestDist) {
            bestDist = dist;
            best = n;
        }
    }

    return best;
}

function resolveTarget(unit, world) {
    if (unit.lastSeen?.id === undefined || unit.lastSeen?.id === null) return null;

    const target = world.units.find(u => u.id === unit.lastSeen.id);

    if (!target || !target.alive) {
        unit.lastSeen = null;
        return null;
    }

    return target;
}

// TODO: Implement human like smooth turning
export function faceTarget(unit, x, y) {
    const dx = x - unit.x;
    const dy = y - unit.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) return;

    unit.dir.x = dx / dist;
    unit.dir.y = dy / dist;
}

// tODO: Add friendly brains?