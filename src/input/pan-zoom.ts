import { MAX_ZOOM, MIN_ZOOM, WHEEL_ZOOM_SPEED } from "../config/defaults";
import { panBy, scaleFromZoom, zoomAt, type Viewport } from "../core/viewport";

export function attachPanZoom(canvas: HTMLCanvasElement, view: Viewport, onChange: () => void): void {
    const minScale = scaleFromZoom(MIN_ZOOM);
    const maxScale = scaleFromZoom(MAX_ZOOM);
    let dragging = false;
    let lastX = 0, lastY = 0;

    const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX; lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        panBy(view, e.clientX - lastX, e.clientY - lastY);
        lastX = e.clientX; lastY = e.clientY;
        onChange();
    };
    const onUp = (e: PointerEvent) => {
        dragging = false;
        canvas.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        zoomAt(view, e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * WHEEL_ZOOM_SPEED), minScale, maxScale);
        onChange();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

}