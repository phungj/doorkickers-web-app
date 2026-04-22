import {canSee, hasLineOfSight} from "./los.js";

export function playerBrain(unit, world) {

}

export function enemyBrain(unit, world) {
    let closestTarget = null;
    let closestDist = Infinity;

    for (const u of world.units) {
        if (u.type !== "player") continue;

        if (!canSee(unit, u.x, u.y)) continue;

        const dx = u.x - unit.x;
        const dy = u.y - unit.y;
        const dist = Math.hypot(dx, dy);

        if (dist < closestDist) {
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