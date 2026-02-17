import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, X, Send, Mic, MicOff, Clock, GripHorizontal, EyeOff } from "lucide-react";
import { getUserFeedback, submitFeedback } from "../lib/dataService";

const STORAGE_POS_KEY = "wbc_feedback_pos";
const STORAGE_HIDDEN_KEY = "wbc_feedback_hidden";

function getSavedPos() {
  try {
    const saved = localStorage.getItem(STORAGE_POS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { x: window.innerWidth - 160, y: 24 };
}

export default function FeedbackPanel() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(() => localStorage.getItem(STORAGE_HIDDEN_KEY) === "true");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [pos, setPos] = useState(getSavedPos);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const recognitionRef = useRef(null);
  const location = useLocation();
  const email = localStorage.getItem("wbc_user_email") || "";

  const loadHistory = () => {
    if (email) getUserFeedback(email).then(setHistory);
  };

  useEffect(() => {
    if (open) loadHistory();
  }, [open]);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest("[data-no-drag]")) return;
    e.preventDefault();
    didDrag.current = false;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setDragging(true);
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      didDrag.current = true;
      const newX = Math.max(0, Math.min(window.innerWidth - 140, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 44, e.clientY - dragOffset.current.y));
      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      setDragging(false);
      setPos((p) => { localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(p)); return p; });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging]);

  const handleButtonClick = () => {
    if (didDrag.current) return;
    setOpen(!open);
  };

  const handleHide = (e) => {
    e.stopPropagation();
    setHidden(true);
    localStorage.setItem(STORAGE_HIDDEN_KEY, "true");
  };

  const handleShow = () => {
    setHidden(false);
    localStorage.removeItem(STORAGE_HIDDEN_KEY);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    await submitFeedback({
      user_email: email,
      user_name: localStorage.getItem("wbc_user") || "Unknown",
      user_role: localStorage.getItem("wbc_user_role") || "unknown",
      message: message.trim(),
      page: location.pathname,
    });
    setMessage("");
    setSending(false);
    loadHistory();
  };

  const toggleSpeech = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Speech recognition is not supported in this browser.");
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setMessage((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  if (hidden) {
    return (
      <button
        onClick={handleShow}
        className="fixed bottom-4 right-4 z-50 p-2 rounded-full bg-navy-800 border border-navy-700 text-navy-400 hover:text-gold-400 hover:border-gold-500/50 shadow-lg transition-all cursor-pointer"
        title="Show feedback button"
      >
        <MessageSquare size={14} />
      </button>
    );
  }

  return (
    <>
      <div
        onMouseDown={onMouseDown}
        onClick={handleButtonClick}
        style={{ left: pos.x, top: pos.y, userSelect: "none" }}
        className={`fixed z-50 flex items-center gap-1.5 rounded-full bg-gold-500 text-navy-950 shadow-lg transition-shadow ${dragging ? "shadow-2xl scale-105" : "hover:bg-gold-400"} cursor-grab active:cursor-grabbing`}
      >
        <div className="flex items-center gap-2 pl-3 pr-1 py-2">
          <GripHorizontal size={12} className="text-navy-950/40" />
          <MessageSquare size={14} />
          <span className="text-sm font-semibold">Feedback</span>
        </div>
        <button
          data-no-drag
          onClick={handleHide}
          className="p-1.5 mr-1 rounded-full hover:bg-navy-950/20 transition-colors cursor-pointer"
          title="Hide feedback button"
        >
          <EyeOff size={12} />
        </button>
      </div>

      {open && (
        <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-navy-900 border-l border-navy-800 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-navy-800">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-gold-400" />
              <h2 className="text-white font-semibold">Send Feedback</h2>
            </div>
            <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-white cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <p className="text-navy-400 text-xs mb-2">Your feedback helps us improve. Type or use the microphone.</p>
              <p className="text-navy-500 text-xs mb-2">Page: <span className="text-navy-300">{location.pathname}</span></p>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleSubmit(); }}
                  placeholder="What's on your mind?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-navy-700 text-white text-sm placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none pr-12"
                />
                <button
                  onClick={toggleSpeech}
                  className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors cursor-pointer ${
                    listening
                      ? "bg-red-500/20 text-red-400 animate-pulse"
                      : "text-navy-500 hover:text-gold-400 hover:bg-navy-800"
                  }`}
                  title={listening ? "Stop recording" : "Voice input"}
                >
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
              {listening && <p className="text-red-400 text-xs mt-1 animate-pulse">Listening...</p>}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold-500 text-navy-950 text-sm font-semibold hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Send size={14} />
                {sending ? "Sending..." : "Submit Feedback"}
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-navy-500" />
                <h3 className="text-navy-300 text-sm font-medium">Your Past Feedback</h3>
              </div>
              {history.length === 0 ? (
                <p className="text-navy-600 text-xs text-center py-4">No feedback submitted yet</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="bg-navy-950 border border-navy-800 rounded-lg px-4 py-3">
                      <p className="text-navy-200 text-sm whitespace-pre-wrap">{item.message}</p>
                      <p className="text-navy-600 text-xs mt-1.5">
                        {item.page && <span className="text-navy-500">{item.page} &middot; </span>}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
