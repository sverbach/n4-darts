import type { AdminPlayer } from "@n4/server/api";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar.tsx";

/** Size of the crop square on screen, and of the uploaded photo. */
const VIEW = 280;
const OUTPUT = 512;
const MAX_ZOOM = 4;

interface Crop {
  zoom: number;
  /** Top-left corner of the image inside the square, in screen pixels. */
  x: number;
  y: number;
}

/** Pick a photo (camera or gallery), crop it to a square, upload it; or remove the current one. */
export function PhotoEditor(props: { player: AdminPlayer; onClose(): void; onChanged(): void }) {
  const { player, onClose, onChanged } = props;
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({ zoom: 1, x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  // The image covers the square at zoom 1.
  const baseScale = image ? Math.max(VIEW / image.naturalWidth, VIEW / image.naturalHeight) : 1;
  const scale = baseScale * crop.zoom;

  /** Keeps the square covered: the image can't be moved past its edges. */
  const clamp = (next: Crop): Crop => {
    if (!image) return next;
    const s = baseScale * next.zoom;
    const minX = VIEW - image.naturalWidth * s;
    const minY = VIEW - image.naturalHeight * s;
    return {
      zoom: next.zoom,
      x: Math.min(0, Math.max(minX, next.x)),
      y: Math.min(0, Math.max(minY, next.y)),
    };
  };

  /** Zooms around the middle of the square. */
  const zoomTo = (zoom: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, zoom));
    const ratio = z / crop.zoom;
    const c = VIEW / 2;
    setCrop(clamp({ zoom: z, x: c - (c - crop.x) * ratio, y: c - (c - crop.y) * ratio }));
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.max(VIEW / img.naturalWidth, VIEW / img.naturalHeight);
      setImage(img);
      setCrop({
        zoom: 1,
        x: (VIEW - img.naturalWidth * s) / 2,
        y: (VIEW - img.naturalHeight * s) / 2,
      });
    };
    img.onerror = () => setError("That file isn't a picture this browser can read");
    img.src = url;
  };
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.src);
    },
    [image],
  );

  const onPointerDown = (e: PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerMove = (e: PointerEvent) => {
    const before = pointers.current.get(e.pointerId);
    if (!before) return;
    const others = [...pointers.current].filter(([id]) => id !== e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const other = others[0]?.[1];
    if (other) {
      // Pinch: zoom by how much the distance between the two fingers changed.
      const was = Math.hypot(before.x - other.x, before.y - other.y);
      const now = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      if (was > 0) zoomTo(crop.zoom * (now / was));
      return;
    }
    setCrop((c) => clamp({ ...c, x: c.x + e.clientX - before.x, y: c.y + e.clientY - before.y }));
  };
  const onPointerUp = (e: PointerEvent) => pointers.current.delete(e.pointerId);

  const save = async () => {
    if (!image) return;
    setSaving(true);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const side = VIEW / scale;
    canvas
      .getContext("2d")
      ?.drawImage(image, -crop.x / scale, -crop.y / scale, side, side, 0, 0, OUTPUT, OUTPUT);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    const res = blob
      ? await fetch(`/api/admin/players/${player.id}/photo`, {
          method: "PUT",
          headers: { "content-type": "image/jpeg" },
          body: blob,
        }).catch(() => null)
      : null;
    setSaving(false);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
      return setError(body?.error ?? "Couldn't save the photo");
    }
    onChanged();
    onClose();
  };

  const remove = async () => {
    if (!confirm(`Remove ${player.name}'s photo?`)) return;
    const res = await fetch(`/api/admin/players/${player.id}/photo`, { method: "DELETE" }).catch(
      () => null,
    );
    if (!res?.ok) return setError("Couldn't remove the photo");
    onChanged();
    onClose();
  };

  return (
    <div className="photo-overlay">
      <div className="photo-editor" role="dialog" aria-label={`Photo of ${player.name}`}>
        <div className="photo-editor-head">
          <div>
            <span className="match-label">Photo</span>
            <h2>{player.name}</h2>
          </div>
          <button type="button" onClick={onClose}>
            Close ✕
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          aria-label="Photo file"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {image ? (
          <>
            <div
              className="crop"
              role="img"
              aria-label="Crop area: drag to move"
              style={{ width: VIEW, height: VIEW }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={(e) => zoomTo(crop.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))}
            >
              <img
                src={image.src}
                alt=""
                draggable={false}
                style={{
                  width: image.naturalWidth * scale,
                  height: image.naturalHeight * scale,
                  transform: `translate(${crop.x}px, ${crop.y}px)`,
                }}
              />
              {/* The octagon every avatar is cut to. */}
              <svg className="crop-frame" viewBox="0 0 100 100" aria-hidden="true">
                <polygon points="12.5,0.5 87.5,0.5 99.5,12.5 99.5,87.5 87.5,99.5 12.5,99.5 0.5,87.5 0.5,12.5" />
              </svg>
            </div>
            <p className="hint">Drag to move, pinch, scroll or use the slider to zoom.</p>
            <label className="zoom label">
              Zoom
              <span aria-hidden="true">−</span>
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={crop.zoom}
                onChange={(e) => zoomTo(Number(e.target.value))}
              />
              <span aria-hidden="true">+</span>
            </label>
            <div className="photo-actions">
              <button type="button" onClick={() => fileInput.current?.click()}>
                Choose another
              </button>
              <button type="button" className="primary cta" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="photo-current">
              <Avatar player={player} large />
            </div>
            <div className="photo-actions">
              {player.photo && (
                <button type="button" className="danger" onClick={remove}>
                  Remove photo
                </button>
              )}
              <button
                type="button"
                className="primary cta"
                onClick={() => fileInput.current?.click()}
              >
                {player.photo ? "Change photo" : "Add photo"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
