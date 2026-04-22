import { Tile, getTileAt } from "./map.js";

export function hasLineOfSight(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;

    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4);

    let lastX = x0;
    let lastY = y0;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;

        const x = x0 + dx * t;
        const y = y0 + dy * t;

        const tile = getTileAt(x, y);

        if (tile === Tile.WALL || tile === Tile.DOOR_CLOSED) {
            return false;
        }

        lastX = x;
        lastY = y;
    }

    return true;
}

export function canSee(observer, x, y) {
    const dx = x - observer.x;
    const dy = y - observer.y;

    const dist = Math.hypot(dx, dy);
    if (dist === 0) return true;

    // Range
    if (dist > observer.visionRange) return false;

    // Direction (FOV)
    const ndx = dx / dist;
    const ndy = dy / dist;

    // TODO: Tune this as necessary
    // TODO: Possibly also separate this out to the unit
    const FOV_ANGLE = 135 * Math.PI / 180;
    const cosHalfAngle = Math.cos(FOV_ANGLE / 2);

    const dot = ndx * observer.dir.x + ndy * observer.dir.y;
    if (dot < cosHalfAngle) return false;

    // Optional extra constraint (keep if needed)
    if (!withinVision(observer, x, y)) return false;

    // LOS
    return hasLineOfSight(observer.x, observer.y, x, y);
}

export function withinVision(unit, worldX, worldY) {
    const dx = worldX - unit.x;
    const dy = worldY - unit.y;

    return Math.hypot(dx, dy) <= unit.visionRange;
}