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