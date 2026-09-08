import { useCallback, useEffect, useRef, useState } from "react";
import { playSound, type SoundHandle } from "../lib/sound-player";

const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";

export function useSoundToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setMessage(null);
  }, []);

  const show = useCallback((text: string) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }
    setMessage(text);
    timer.current = window.setTimeout(() => {
      setMessage(null);
      timer.current = null;
    }, 3500);
  }, []);

  const play = useCallback((mp3: string, label = "sound"): SoundHandle => {
    const handle = playSound(mp3);
    void handle.status.then((status) => {
      if (status === "blocked") {
        show("Sound blocked by the app — tap ♪ to try again");
      } else if (status === "error") {
        show(`Couldn't load that sound`);
      }
    });
    return handle;
  }, [show]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  return { toast: message, play, show, clear };
}

export function SoundToast({ message }: { readonly message: string | null }) {
  if (message === null) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-16 left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-sm px-4 py-2 text-sm text-[#F1ECDD] shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
      role="status"
      style={{ fontFamily: chalkFont, background: "rgba(18,37,31,0.95)", border: "2px solid #F4C860" }}
    >
      {message}
    </div>
  );
}