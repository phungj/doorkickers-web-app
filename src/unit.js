import { getTileAt, openDoorAt, Tile } from "./map.js";

export function createUnit(x, y) {
    return {
        x,
        y,
        size: 15,
        path: [],
        targetIndex: 0
    };
}

export function updateUnit(unit) {
    if (unit.path.length === 0 || unit.targetIndex >= unit.path.length) return;

    const target = unit.path[unit.targetIndex];
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;

    const dist = Math.hypot(dx, dy);
    const speed = 2;

    if (dist < speed) {
        unit.x = target.x;
        unit.y = target.y;
        unit.targetIndex++;
        return;
    }

    const nextX = unit.x + (dx / dist) * speed;
    const nextY = unit.y + (dy / dist) * speed;

    const tile = getTileAt(nextX, nextY);

    if (tile === Tile.WALL) return;

    if (tile === Tile.DOOR_CLOSED) {
        openDoorAt(nextX, nextY);
    }

    unit.x = nextX;
    unit.y = nextY;
}

export function drawUnit(ctx, unit) {
    ctx.fillStyle = "cyan";
    ctx.fillRect(
        unit.x - unit.size / 2,
        unit.y - unit.size / 2,
        unit.size,
        unit.size
    );

    // draw path
    ctx.strokeStyle = "yellow";
    ctx.beginPath();

    for (let i = unit.targetIndex; i < unit.path.length; i++) {
        const p = unit.path[i];
        if (i === unit.targetIndex) ctx.moveTo(unit.x, unit.y);
        else ctx.lineTo(p.x, p.y);
    }

    ctx.stroke();
}