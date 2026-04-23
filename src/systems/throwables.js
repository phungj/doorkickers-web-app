import {getTileWorld, isBlockingTile} from "../map.js";
import {hasLineOfSight} from "../los.js";

export const FLASHBANG_RADIUS = 80;
export const FLASHBANG_DURATION = 200;
export const FLASHBANG_MAX_RANGE = 250;

// TODO: Make flashbangs make noise
// TODO: Make flashbangs not impact
export function updateFlashbangs(world, dt) {
    const now = performance.now();

    world.events.flashbangs = world.events.flashbangs.filter(fb => {
        if (!fb.detonated) {
            moveFlashbangWithCollision(fb, dt)

            const tile = getTileWorld(fb.x, fb.y);

            if (isBlockingTile(tile)) {
                fb.detonated = true;
                fb.hitWall = true;
                fb.expiryTime = now + 200;
            }

            // detonate when time is reached
            if (now >= fb.detonationTime) {
                detonateFlashbang(world, fb);
                fb.detonated = true;
            }

            return true;
        }

        // cleanup
        return now < fb.expiryTime;
    });
}

export function moveFlashbangWithCollision(fb, dt) {
    // dt is in seconds

    const moveX = fb.vx * dt;
    const moveY = fb.vy * dt;

    const distance = Math.hypot(moveX, moveY);
    const steps = Math.max(1, Math.ceil(distance / 5));

    const stepX = moveX / steps;
    const stepY = moveY / steps;

    for (let i = 0; i < steps; i++) {
        const nextX = fb.x + stepX;
        const nextY = fb.y + stepY;

        const tile = getTileWorld(nextX, nextY);

        if (isBlockingTile(tile)) {
            fb.x = nextX;
            fb.y = nextY;

            fb.hitWall = true;
            fb.detonated = true;

            // convert to ms only for expiry timers
            fb.expiryTime = performance.now() + 200;

            return;
        }

        fb.x = nextX;
        fb.y = nextY;
    }
}

function detonateFlashbang(world, fb) {
    for (const unit of world.units) {
        const dx = unit.x - fb.x;
        const dy = unit.y - fb.y;
        const dist = Math.hypot(dx, dy);

        if (dist > fb.radius) continue;

        if (!hasLineOfSight(fb.x, fb.y, unit.x, unit.y)) {
            continue;
        }

        applyFlashbangEffect(unit, fb);
    }
}

function applyFlashbangEffect(unit, fb) {
    if (unit.type !== "player") {
        unit.blindedUntil = performance.now() + fb.effect.blindDuration;
        unit.deafUntil = performance.now() + fb.effect.deafDuration;
    }
}

export function clampFlashbangTarget(origin, target) {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;

    const dist = Math.hypot(dx, dy);

    if (dist <= FLASHBANG_MAX_RANGE) return target;

    const scale = FLASHBANG_MAX_RANGE / dist;

    return {
        x: origin.x + dx * scale,
        y: origin.y + dy * scale
    };
}