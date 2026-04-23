import {getNearbyInteractables, simplifyPath} from "./unit.js";
import {sim, stepSimulation} from "./sim.js";
import {openDoorAt, TILE_SIZE} from "./map.js";

export function setupInput(canvas, world) {
    let selectedUnit = null;
    let dragging = false;

    canvas.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;

        const { x, y } = getMousePos(e);

        if (world.ui.contextMenu) {
            const menu = world.ui.contextMenu;

            const padding = 10;
            const itemHeight = 22;
            const groupSpacing = 6;
            const width = 160;

            let yCursor = menu.y;

            let clicked = null;

            for (const group of menu.options) {
                yCursor += groupSpacing;

                for (const opt of group) {
                    const ox = menu.x;
                    const oy = yCursor;

                    if (
                        x >= ox &&
                        x <= ox + width &&
                        y >= oy &&
                        y <= oy + itemHeight
                    ) {
                        clicked = opt;
                        break;
                    }

                    yCursor += itemHeight;
                }

                if (clicked) break;
            }

            if (clicked?.fn) {
                clicked.fn();
            }

            closeContextMenu(world);
            return;
        }

        handleUnitSelection(e, world);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!dragging || !selectedUnit) return;

        const { x, y } = getMousePos(e);

        // TODO: Refactor this to prevent invalid paths from being drawn
        selectedUnit.rawPath.push({ x, y });
    });

    canvas.addEventListener("mouseup", () => {
        if (dragging && selectedUnit) {
            selectedUnit.waypoints = simplifyPath(selectedUnit.rawPath);
        }

        dragging = false;
    });

    canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        const { x, y } = getMousePos(e);

        const unit = getUnitAt(world.units.filter(u => u.type === "player"), x, y);

        if (unit) {
            selectedUnit = unit;
        } else {
            return;
        }

        if (world.ui.contextMenu) {
            closeContextMenu(world);
            return;
        }

        const interactables = getNearbyInteractables(selectedUnit, world);

        const actions = [];

        for (const interactable of interactables) {
            for (const a of interactable.actions) {
                actions.push(a);
            }
        }

        if (actions.length > 0) {
            openContextMenu(world, actions, x, y);
        } else {
            closeContextMenu(world);
        }
    });

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            sim.paused = !sim.paused;
        }

        if (e.code === "KeyS") {
            stepSimulation();
        }
    });

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function openContextMenu(world, actions, x, y) {
        world.ui.contextMenu = {
            x,
            y,
            options: actions
        };
    }

    function handleUnitSelection(e, world) {
        closeContextMenu(world);

        const { x, y } = getMousePos(e);

        const unit = getUnitAt(world.units.filter(u => u.type === "player"), x, y);

        if (unit) {
            selectedUnit = unit;
            dragging = true;

            unit.rawPath = [];
            unit.waypoints = [];
            unit.targetIndex = 0;
        } else {
            selectedUnit = null;
        }
    }
}

function getUnitAt(units, x, y) {
    return units.find(unit =>
        x > unit.x - unit.size &&
        x < unit.x + unit.size &&
        y > unit.y - unit.size &&
        y < unit.y + unit.size
    );
}

function closeContextMenu(world) {
    world.ui.contextMenu = null;
}

