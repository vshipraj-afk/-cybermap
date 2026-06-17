import { useState } from "react";
import "./App.css";

export default function App() {
  const [surfaces, setSurfaces] = useState([
    {
      id: 1,
      name: "Surface 1",
      video: null,
      youtube: null,
      youtubeInput: "",
      urlInput: "",
      points: [
        { x: 100, y: 100 },
        { x: 320, y: 100 },
        { x: 320, y: 260 },
        { x: 100, y: 260 }
      ]
    }
  ]);

  const addSurface = () => {
    const n = surfaces.length;
    setSurfaces([
      ...surfaces,
      {
        id: Date.now(),
        name: `Surface ${n + 1}`,
        video: null,
        youtube: null,
        youtubeInput: "",
        urlInput: "",
        points: [
          { x: 100 + n * 50, y: 100 + n * 40 },
          { x: 320 + n * 50, y: 100 + n * 40 },
          { x: 320 + n * 50, y: 260 + n * 40 },
          { x: 100 + n * 50, y: 260 + n * 40 }
        ]
      }
    ]);
  };

  const updateSurface = (index, patch) => {
    setSurfaces((old) =>
      old.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const setSurfaceVideoFile = (index, file) => {
    if (!file) return;
    updateSurface(index, { video: URL.createObjectURL(file) });
  };

  const loadUrl = (index) => {
    const url = surfaces[index].urlInput.trim();
    if (!url) return;
    updateSurface(index, { video: url, youtube: null });
  };

  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/);
    return match ? match[1] : "";
  };

  const loadYouTube = (index) => {
    const url = surfaces[index].youtubeInput.trim();
    const id = getYouTubeId(url);
    if (!id) return alert("Invalid YouTube link");
    updateSurface(index, {
      youtube: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0`,
      video: null
    });
  };

  return (
    <div className="app">
      <h1>CyberMap</h1>

      <div className="toolbar">
        <button onClick={addSurface}>+ Add Surface</button>
        <button onClick={() => document.documentElement.requestFullscreen()}>
          Fullscreen Projector Mode
        </button>
      </div>

      <div className="surfaceList">
        {surfaces.map((s, i) => (
          <div className="mediaCard" key={s.id}>
            <strong>{s.name}</strong>

            <label>
              Local MP4:
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setSurfaceVideoFile(i, e.target.files[0])}
              />
            </label>

            <label>
              URL MP4:
              <input
                type="text"
                placeholder="https://example.com/video.mp4"
                value={s.urlInput}
                onChange={(e) =>
                  updateSurface(i, { urlInput: e.target.value })
                }
              />
            </label>

            <button onClick={() => loadUrl(i)}>Load MP4 URL</button>

            <label>
              YouTube Link:
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                value={s.youtubeInput}
                onChange={(e) =>
                  updateSurface(i, { youtubeInput: e.target.value })
                }
              />
            </label>

            <button onClick={() => loadYouTube(i)}>Load YouTube</button>
          </div>
        ))}
      </div>

      <div className="stage">
        {surfaces.map((surface, sIndex) => {
          const polygon = surface.points
            .map((p) => `${p.x}px ${p.y}px`)
            .join(",");

          return (
            <div key={surface.id}>
              <div
                className="warped"
                style={{ clipPath: `polygon(${polygon})` }}
                onPointerDown={(e) => {
                  if (e.target.classList.contains("handle")) return;

                  let lastX = e.clientX;
                  let lastY = e.clientY;

                  const move = (ev) => {
                    const dx = ev.clientX - lastX;
                    const dy = ev.clientY - lastY;

                    lastX = ev.clientX;
                    lastY = ev.clientY;

                    setSurfaces((old) =>
                      old.map((s, si) =>
                        si === sIndex
                          ? {
                              ...s,
                              points: s.points.map((p) => ({
                                x: p.x + dx,
                                y: p.y + dy
                              }))
                            }
                          : s
                      )
                    );
                  };

                  const up = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", up);
                  };

                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", up);
                }}
              >
                {surface.youtube ? (
                  <iframe
                    src={surface.youtube}
                    className="videoLayer"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : surface.video ? (
                  <video
                    src={surface.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="videoLayer"
                  />
                ) : (
                  <div className="mappedGrid">{surface.name}</div>
                )}
              </div>

              {surface.points.map((p, i) => (
                <div
                  key={i}
                  className="handle"
                  style={{ left: p.x, top: p.y }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const stage =
                      e.currentTarget.parentElement.getBoundingClientRect();

                    const move = (ev) => {
                      setSurfaces((old) =>
                        old.map((s, si) => {
                          if (si !== sIndex) return s;

                          const pts = [...s.points];
                          pts[i] = {
                            x: ev.clientX - stage.left,
                            y: ev.clientY - stage.top
                          };

                          return { ...s, points: pts };
                        })
                      );
                    };

                    const up = () => {
                      window.removeEventListener("pointermove", move);
                      window.removeEventListener("pointerup", up);
                    };

                    window.addEventListener("pointermove", move);
                    window.addEventListener("pointerup", up);
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
