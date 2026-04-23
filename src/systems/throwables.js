// TODO: Make flashbangs make noise
export function updateFlashbangs(world) {
    const now = performance.now();

    for (const fb of world.events.flashbangs) {
        if (fb.detonated) continue;

        if (now >= fb.detonationTime) {
            detonateFlashbang(world, fb);
            fb.detonated = true;
        }
    }
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