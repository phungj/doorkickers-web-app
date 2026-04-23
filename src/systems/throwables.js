export const FLASHBANG_RADIUS = 80;
export const FLASHBANG_DURATION = 200;

// TODO: Make flashbangs make noise
export function updateFlashbangs(world) {
    const now = performance.now();

    world.events.flashbangs = world.events.flashbangs.filter(fb => {
        if (!fb.detonated) {
            if (now >= fb.detonationTime) {
                detonateFlashbang(world, fb);
                fb.detonated = true;
            }
            return true;
        }

        // 🔹 remove after expiration
        return now < fb.expiryTime;
    });
}

function detonateFlashbang(world, fb) {
    for (const unit of world.units) {
        const dx = unit.x - fb.x;
        const dy = unit.y - fb.y;
        const dist = Math.hypot(dx, dy);

        if (dist > fb.radius) continue;

        // optional: LOS check later
        applyFlashbangEffect(unit, fb);
    }
}

function applyFlashbangEffect(unit, fb) {
    if (unit.type !== "player") {
        unit.blindedUntil = performance.now() + fb.effect.blindDuration;
        unit.deafUntil = performance.now() + fb.effect.deafDuration;
    }
}