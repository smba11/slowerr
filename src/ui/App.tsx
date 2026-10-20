import { useEffect, useRef, useState } from "react";
import { Game } from "../game/Game";
import { CAMERA_MODES, DEFAULT_SETTINGS } from "../game/types";
import type { Settings, Telemetry, Quality } from "../game/types";
import { Icon } from "./Icon";

function initialSettings(): Settings {
  try {
    const saved = JSON.parse(
      localStorage.getItem("slowerr:settings:v1") || "{}",
    );
    return {
      ...DEFAULT_SETTINGS,
      quality: ["low", "balanced", "high"].includes(saved.quality)
        ? saved.quality
        : "balanced",
      followDistance: Number.isFinite(saved.followDistance)
        ? Math.max(12, Math.min(34, saved.followDistance))
        : DEFAULT_SETTINGS.followDistance,
      followHeight: Number.isFinite(saved.followHeight)
        ? Math.max(4, Math.min(18, saved.followHeight))
        : DEFAULT_SETTINGS.followHeight,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
const CAMERA_NAMES = {
  follow: "Follow",
  cinematic: "Cinematic",
  cab: "Driver’s seat",
  free: "Free look",
};
export function App() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    speed: 0,
    distance: 0,
    elapsed: 0,
    fps: 0,
    chunks: 0,
    district: "Marigold Quarter",
  });
  const [seed] = useState(
    () =>
      new URLSearchParams(location.search).get("seed")?.slice(0, 80) ||
      "amberline",
  );
  const [seedInput, setSeedInput] = useState(seed);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  const [details, setDetails] = useState(false);
  const bootSettings = useRef(settings);
  useEffect(() => {
    if (!host.current) return;
    let active = true;
    try {
      game.current = new Game(
        host.current,
        seed,
        bootSettings.current,
        setTelemetry,
        setError,
        new URLSearchParams(location.search).has("at")
          ? Number(new URLSearchParams(location.search).get("at"))
          : 12,
      );
    } catch (e) {
      queueMicrotask(() => {
        if (active)
          setError(
            `Your browser could not start the 3D scene. Try enabling hardware acceleration and reloading. ${e instanceof Error ? e.message : ""}`,
          );
      });
    }
    return () => {
      active = false;
      game.current?.dispose();
      game.current = null;
    };
  }, [seed]);
  useEffect(() => {
    game.current?.applySettings({
      ...settings,
      paused: settings.paused || settingsOpen,
    });
    try {
      localStorage.setItem(
        "slowerr:settings:v1",
        JSON.stringify({
          quality: settings.quality,
          followDistance: settings.followDistance,
          followHeight: settings.followHeight,
        }),
      );
    } catch {
      /* Private browsing can deny storage. */
    }
  }, [settings, settingsOpen]);
  useEffect(() => {
    if (settingsOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [settingsOpen]);
  useEffect(() => {
    if (notice) {
      const timeout = setTimeout(() => setNotice(""), 2800);
      return () => clearTimeout(timeout);
    }
  }, [notice]);
  useEffect(() => {
    const keys = new Set<string>();
    const keydown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input,select,textarea,dialog")
      )
        return;
      const key = event.key.toLowerCase();
      if (
        key === " " &&
        event.target instanceof HTMLElement &&
        event.target.closest("button")
      )
        return;
      if ([" ", "arrowup", "arrowdown"].includes(key)) event.preventDefault();
      if (["w", "s", "arrowup", "arrowdown"].includes(key) && !keys.has(key)) {
        keys.add(key);
        const delta = key === "w" || key === "arrowup" ? 1 : -1;
        setSettings((s) => ({
          ...s,
          targetSpeed: Math.max(0, Math.min(36, s.targetSpeed + delta)),
        }));
      }
      if (event.repeat) return;
      if (key === " ") setSettings((s) => ({ ...s, paused: !s.paused }));
      if (key === "c")
        setSettings((s) => ({
          ...s,
          camera:
            CAMERA_MODES[
              (CAMERA_MODES.indexOf(s.camera) + 1) % CAMERA_MODES.length
            ],
        }));
      if (key === "h") setHidden((v) => !v);
      if (key === "b")
        void game.current
          ?.bell()
          .catch(() => setNotice("Audio is unavailable in this browser."));
    };
    const keyup = (event: KeyboardEvent) =>
      keys.delete(event.key.toLowerCase());
    const clear = () => keys.clear();
    const timer = setInterval(() => {
      const delta =
        (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
      if (delta)
        setSettings((s) => ({
          ...s,
          targetSpeed: Math.max(0, Math.min(36, s.targetSpeed + delta)),
        }));
    }, 100);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", clear);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", clear);
    };
  }, []);
  const changeSpeed = (delta: number) =>
    setSettings((s) => ({
      ...s,
      targetSpeed: Math.max(0, Math.min(36, s.targetSpeed + delta)),
    }));
  const cycleCamera = () =>
    setSettings((s) => ({
      ...s,
      camera:
        CAMERA_MODES[
          (CAMERA_MODES.indexOf(s.camera) + 1) % CAMERA_MODES.length
        ],
    }));
  const share = async () => {
    const url = new URL(location.href);
    url.searchParams.set("seed", seed);
    url.searchParams.set("at", String(Math.round(telemetry.progress ?? 12)));
    try {
      await navigator.clipboard.writeText(url.href);
      setNotice("Journey link copied. Same seed, same little world.");
    } catch {
      setNotice("Share this page’s address with ?seed=" + seed);
    }
  };
  return (
    <main className={`experience ${details ? "details-expanded" : ""}`}>
      <div className="world" ref={host} />
      <div className="paper-grain" />
      {!hidden && (
        <>
          <header className="topbar">
            <div className="brand">
              <span className="brand-mark">
                <Icon name="tram" size={25} />
              </span>
              <div>
                <span className="wordmark">
                  slowerr<span className="brand-dot">.</span>
                </span>
                <span className="brand-tagline">TAKE THE SCENIC ROUTE</span>
              </div>
            </div>
            <div className="journey-badge">
              <span className="status-dot" /> ENDLESS EXPLORATION{" "}
              <span className="badge-divider" /> <Icon name="sun" size={15} /> A
              little golden hour
            </div>
            <div className="top-actions">
              <button
                className="icon-button"
                title="Share this seed"
                aria-label="Share this seed"
                onClick={() => void share()}
              >
                <Icon name="share" />
              </button>
              <button
                className="icon-button"
                title="Hide interface (H)"
                aria-label="Hide interface"
                onClick={() => setHidden(true)}
              >
                <Icon name="eye" />
              </button>
              <button
                className="settings-button"
                onClick={() => setSettingsOpen(true)}
              >
                <Icon name="settings" size={18} />
                <span>Settings</span>
              </button>
            </div>
          </header>
          <aside className="route-card">
            <span className="eyebrow">YOUR LITTLE CORNER OF THE WORLD</span>
            <h1>{telemetry.district}</h1>
            <p>Nowhere to be. Plenty to see.</p>
            <div className="route-meta">
              <span className="route-number">07</span>
              <span>
                THE AMBERLINE
                <span className="route-sub">Town &amp; waterside service</span>
              </span>
              <svg
                viewBox="0 0 80 45"
                className="route-doodle"
                aria-hidden="true"
              >
                <path
                  d="M4 36c7-43 24 13 39-14S65 7 76 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle cx="4" cy="36" r="3" fill="currentColor" />
                <circle
                  cx="76"
                  cy="7"
                  r="3"
                  fill="none"
                  stroke="currentColor"
                />
              </svg>
            </div>
          </aside>
          <div className="world-label">
            <Icon name="leaf" size={15} /> A world grown from{" "}
            <span>{seed}</span>
          </div>
          <section className="bottom-ui" aria-label="Tram controls">
            <div className="journey-stats">
              <span className="eyebrow">A LITTLE FURTHER</span>
              <div className="distance-value">
                {(telemetry.distance / 1000).toFixed(2)}
                <span>km wandered</span>
              </div>
              <div className="elapsed">
                {Math.floor(telemetry.elapsed / 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {Math.floor(telemetry.elapsed % 60)
                  .toString()
                  .padStart(2, "0")}{" "}
                <span>of taking it slow</span>
              </div>
            </div>
            <div className="control-area">
              <div className="control-caption">
                {settings.paused
                  ? "A moment to take it all in."
                  : settings.targetSpeed === 0
                    ? "Coming to a gentle stop."
                    : "Let the town come to you."}
              </div>
              <div className="control-dock">
                <button
                  className="play-button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, paused: !s.paused }))
                  }
                  aria-label={
                    settings.paused ? "Resume journey" : "Pause journey"
                  }
                  title="Pause / resume (Space)"
                >
                  <Icon name={settings.paused ? "play" : "pause"} size={22} />
                </button>
                <div className="dock-divider" />
                <div className="speed-control">
                  <div className="speed-readout">
                    <strong>
                      {Math.round(telemetry.speed).toString().padStart(2, "0")}
                    </strong>
                    <span>
                      km/h
                      <span className="target-speed">
                        cruise {settings.targetSpeed}
                      </span>
                    </span>
                  </div>
                  <div className="throttle">
                    <button
                      onClick={() => changeSpeed(-3)}
                      aria-label="Decrease cruise speed"
                    >
                      <Icon name="minus" size={15} />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="36"
                      value={settings.targetSpeed}
                      aria-label="Cruise speed"
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          targetSpeed: Number(e.target.value),
                        }))
                      }
                      style={{
                        backgroundSize: `${(settings.targetSpeed / 36) * 100}% 100%`,
                      }}
                    />
                    <button
                      onClick={() => changeSpeed(3)}
                      aria-label="Increase cruise speed"
                    >
                      <Icon name="plus" size={15} />
                    </button>
                  </div>
                </div>
                <div className="dock-divider" />
                <button
                  className="camera-button"
                  onClick={cycleCamera}
                  aria-label={`Camera: ${CAMERA_NAMES[settings.camera]}. Change view.`}
                  title="Change camera (C)"
                >
                  <Icon name="camera" />
                  <span>{CAMERA_NAMES[settings.camera]}</span>
                </button>
                <button
                  className="bell-button"
                  onClick={() =>
                    void game.current
                      ?.bell()
                      .then(() => setNotice("Ding ding. Just passing through."))
                      .catch(() =>
                        setNotice("Audio is unavailable in this browser."),
                      )
                  }
                  aria-label="Ring tram bell"
                  title="Ring bell (B)"
                >
                  <Icon name="bell" />
                </button>
              </div>
              <div className="keyboard-hints">
                <span>
                  <kbd>W</kbd>
                  <kbd>S</kbd> speed
                </span>
                <span>
                  <kbd>SPACE</kbd> pause
                </span>
                <span>
                  <kbd>C</kbd> camera
                </span>
                <button onClick={() => setHelp((v) => !v)}>
                  {" "}
                  {help ? "Close guide" : "A small guide"} <span>?</span>
                </button>
                <button
                  aria-pressed={details}
                  onClick={() => setDetails((value) => !value)}
                >
                  {details ? "Less on screen" : "Journey details"}
                </button>
              </div>
            </div>
            <div className="journey-note">
              <span className="small-sun">✳</span>
              <span>
                The best journeys
                <br />
                have no destination.
              </span>
              <span className="version">V0.2 · MADE FOR WANDERING</span>
            </div>
          </section>
          {help && (
            <aside className="guide">
              <button
                className="icon-button"
                onClick={() => setHelp(false)}
                aria-label="Close guide"
              >
                <Icon name="close" size={16} />
              </button>
              <span className="eyebrow">WELCOME ABOARD</span>
              <h2>Make yourself at home.</h2>
              <p>
                Your tram follows the rails. Choose your pace with the slider or
                hold W / S. Space pauses the world; C changes the view; B rings
                the bell; H hides the interface. Drag the scenery to look
                around, scroll to zoom, and double-click to recenter. Your tram
                cruises automatically; the rails take care of steering.
              </p>
              <p>
                There’s no finish line. Change the seed in Settings to discover
                a different town.
              </p>
            </aside>
          )}
          {settings.paused && !settingsOpen && (
            <div className="pause-card">
              <Icon name="leaf" size={26} />
              <span className="eyebrow">NO NEED TO HURRY</span>
              <h2>A little interlude.</h2>
              <button
                onClick={() => setSettings((s) => ({ ...s, paused: false }))}
              >
                Continue wandering <Icon name="arrow" size={17} />
              </button>
            </div>
          )}
        </>
      )}
      {hidden && (
        <button
          className="restore-ui icon-button"
          title="Show interface (H)"
          aria-label="Show interface"
          onClick={() => setHidden(false)}
        >
          <Icon name="eye" />
        </button>
      )}
      <dialog
        ref={dialog}
        aria-label="Journey settings"
        className="settings-dialog"
        onClose={() => setSettingsOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSettingsOpen(false);
        }}
      >
        <div className="settings-content">
          <div className="dialog-heading">
            <span className="eyebrow">MAKE IT YOUR JOURNEY</span>
            <button
              className="icon-button"
              aria-label="Close settings"
              onClick={() => setSettingsOpen(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <h2>A few little things.</h2>
          <p className="dialog-intro">Settle in. The town can wait.</p>
          <fieldset>
            <legend>Scenery &amp; performance</legend>
            <div className="quality-options">
              {(["low", "balanced", "high"] as Quality[]).map((quality) => (
                <button
                  key={quality}
                  className={settings.quality === quality ? "selected" : ""}
                  aria-pressed={settings.quality === quality}
                  onClick={() => setSettings((s) => ({ ...s, quality }))}
                >
                  {quality === "low"
                    ? "Gentle"
                    : quality === "balanced"
                      ? "Balanced"
                      : "Lush"}
                  <small>
                    {quality === "low"
                      ? "Light & simple"
                      : quality === "balanced"
                        ? "The sweet spot"
                        : "More to see"}
                  </small>
                </button>
              ))}
            </div>
            <p className="field-note">
              {telemetry.fps} fps · {telemetry.frameMs ?? "—"} ms per frame ·{" "}
              {settings.quality === "low" ? "Shadows off" : "Soft shadows"}
            </p>
          </fieldset>
          <fieldset className="camera-adjustments">
            <legend>Settle into the view</legend>
            <label htmlFor="camera-distance">
              Follow distance <span>{settings.followDistance} m</span>
            </label>
            <input
              id="camera-distance"
              type="range"
              min="12"
              max="34"
              value={settings.followDistance}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  followDistance: Number(e.target.value),
                }))
              }
            />
            <label htmlFor="camera-height">
              Camera height <span>{settings.followHeight} m</span>
            </label>
            <input
              id="camera-height"
              type="range"
              min="4"
              max="18"
              value={settings.followHeight}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  followHeight: Number(e.target.value),
                }))
              }
            />
            <p className="field-note">
              Drag to look around · scroll to zoom · double-click to recenter.
            </p>
          </fieldset>
          <fieldset>
            <legend>A change of scenery</legend>
            <div className="district-options">
              {[
                ["Marigold", 12],
                ["Willow", 490],
                ["Azure", 920],
              ].map(([name, at]) => (
                <button
                  key={name}
                  onClick={() => {
                    const url = new URL(location.href);
                    url.searchParams.set("seed", seed);
                    url.searchParams.set("at", String(at));
                    location.assign(url.href);
                  }}
                >
                  {name} <Icon name="arrow" size={12} />
                </button>
              ))}
            </div>
            <p className="field-note">
              Jump to a district, or keep cruising to discover each along the
              line.
            </p>
          </fieldset>
          <fieldset>
            <legend>Through your eyes</legend>
            <select
              aria-label="Camera view"
              value={settings.camera}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  camera: e.target.value as Settings["camera"],
                }))
              }
            >
              {CAMERA_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {CAMERA_NAMES[mode]}
                </option>
              ))}
            </select>
          </fieldset>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const next = seedInput.trim();
              if (next) {
                const url = new URL(location.href);
                url.searchParams.set("seed", next);
                url.searchParams.delete("at");
                location.assign(url.href);
              }
            }}
          >
            <label htmlFor="seed">A seed for a new town</label>
            <div className="seed-row">
              <input
                id="seed"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                maxLength={80}
                required
              />
              <button type="submit" aria-label="Start a new seeded journey">
                <Icon name="arrow" />
              </button>
            </div>
            <p className="field-note">
              Same seed, same scenery. A new town restarts your journey.
            </p>
          </form>
          <button
            className="return-button"
            onClick={() => setSettingsOpen(false)}
          >
            Back to the scenic route <Icon name="arrow" size={17} />
          </button>
        </div>
      </dialog>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="error-card" role="alert">
          <h2>A small bump in the tracks.</h2>
          <p>{error}</p>
          <button onClick={() => location.reload()}>Try again</button>
        </div>
      )}
    </main>
  );
}
