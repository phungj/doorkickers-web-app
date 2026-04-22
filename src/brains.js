import {hasLineOfSight} from "./los.js";

export function playerBrain(unit, world) {

}

export function enemyBrain(unit, world) {
    // TODO: Tune aggro range (possibly just make infinite?)
    const AGGRO_RANGE = 150;

    let closestTarget = null;
    let closestDist = Infinity;

    for (const u of world.units) {
        if (u.type !== "player") continue;

        const dx = u.x - unit.x;
        const dy = u.y - unit.y;
        const dist = Math.hypot(dx, dy);

        if (dist > AGGRO_RANGE) continue;
        if (!hasLineOfSight(unit.x, unit.y, u.x, u.y)) continue;

        if (dist < AGGRO_RANGE && dist < closestDist) {
            closestDist = dist;
            closestTarget = u;
        }
    }

    if (!closestTarget) return;

    const currentTarget = unit.waypoints?.[unit.targetIndex];

    const needsUpdate =
        !currentTarget ||
        Math.hypot(currentTarget.x - closestTarget.x, currentTarget.y - closestTarget.y) > 10;

    if (needsUpdate) {
        unit.waypoints = [
            { x: closestTarget.x, y: closestTarget.y }
        ];
        unit.targetIndex = 0;
    }
}

// tODO: Add friendly brains?