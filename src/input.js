export function setupInput(canvas, unit) {
    let dragging = false;

    canvas.addEventListener("mousedown", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (
            mx > unit.x - unit.size &&
            mx < unit.x + unit.size &&
            my > unit.y - unit.size &&
            my < unit.y + unit.size
        ) {
            dragging = true;
            unit.path = [];
            unit.targetIndex = 0;
        }
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!dragging) return;

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        unit.path.push({ x: mx, y: my });
    });

    canvas.addEventListener("mouseup", () => {
        dragging = false;
    });
}