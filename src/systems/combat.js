import {getTileWorld, isBlockingTile} from "../map.js";

// TODO: Add noise to this
export function fireShot(world, shooter, targetX, targetY) {
    const dx = targetX - shooter.x;
    const dy = targetY - shooter.y;

    const dist = Math.hypot(dx, dy);
    const steps = Math.ceil(dist / 4);

    const stepX = dx / steps;
    const stepY = dy / steps;

    let x = shooter.x;
    let y = shooter.y;

    for (let i = 0; i < steps; i++) {
        x += stepX;
        y += stepY;

        // 1. wall hit
        const tile = getTileWorld(x, y);
        if (isBlockingTile(tile)) {
            spawnBulletImpact(world, x, y);
            return;
        }

        // 2. unit hit
        const hit = world.units.find(u => {
            const dx = u.x - x;
            const dy = u.y - y;
            return Math.hypot(dx, dy) < u.size;
        });

        if (hit) {
            applyDamage(hit, shooter);
            spawnBulletImpact(world, x, y);
            return;
        }
    }

    // no hit
}

function applyDamage(unit, shooter) {
    unit.hp = (unit.hp ?? 100) - 34;

    if (unit.hp <= 0) {
        unit.dead = true;
    }
}

function spawnBulletImpact(world, x, y) {
    world.events.impacts.push({
        x,
        y,
        time: performance.now()
    });
}