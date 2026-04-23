import {getGlobalActions, getNearbyInteractables, simplifyPath, throwFlashbang} from "./unit.js";
import {sim, stepSimulation} from "./sim.js";
import {clampFlashbangTarget} from "./systems/throwables.js";

export function setupInput(canvas, world) {
    let selectedUnit = null;
    let dragging = false;

    canvas.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;

        const { x, y } = getMousePos(e);

        if (selectedUnit?.pendingAction) {
            const origin = selectedUnit.pendingAction.origin;

            selectedUnit.pendingAction.target = clampFlashbangTarget(origin, { x, y });
            selectedUnit.pendingAction.confirmed = true;
            return;
        }

        const menu = world.ui.contextMenu;

        if (menu) {
            const padding = 10;
            const itemHeight = 22;
            const width = 160;

            let clicked = null;

            for (let i = 0; i < menu.options.length; i++) {
                const opt = menu.options[i];

                const ox = menu.x;
                const oy = menu.y + i * itemHeight;

                if (
                    x >= ox &&
                    x <= ox + width &&
                    y >= oy &&
                    y <= oy + itemHeight
                ) {
                    clicked = opt;
                    break;
                }
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
        const { x, y } = getMousePos(e);

        if (selectedUnit?.pendingAction) {
            const origin = selectedUnit.pendingAction.origin;

            selectedUnit.pendingAction.target = clampFlashbangTarget(origin, { x, y });
            return;
        }


        if (!dragging || !selectedUnit) return;

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
        const globalActions = getGlobalActions(selectedUnit, world);

        const actions = [
            ...interactables.flatMap(i => i.actions),
            ...globalActions
        ];

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

    function executePendingAction(world, unit) {
        const action = unit.pendingAction;
        if (!action || !action.target) return;

        switch (action.type) {
            case "flashbang":
                throwFlashbang(world, action.origin, action.target);
                break;
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

