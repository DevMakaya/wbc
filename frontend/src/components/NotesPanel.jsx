import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { getNotes, addNote } from "../lib/dataService";
import { trackEvent } from "../lib/tracker";

export default function NotesPanel({ entityType, entityId }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    getNotes(entityType, entityId).then((data) => {
      setNotes(data);
      setLoading(false);
    });
  };

  useEffect(load, [entityType, entityId]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    await addNote(entityType, entityId, text.trim());
    trackEvent("note_added", { entity_type: entityType, entity_id: Number(entityId) });
    setText("");
    load();
  };

  const currentUser = localStorage.getItem("wbc_user") || "User";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note..."
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
          }}
          className="w-full px-4 py-3 rounded-lg bg-navy-950 border border-navy-700 text-white placeholder-navy-500 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-navy-500">
            Posting as {currentUser} &middot; Ctrl+Enter to submit
          </span>
          <button
            onClick={handleAdd}
            disabled={!text.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-navy-950 text-sm font-medium hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Send size={14} />
            Add Note
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-navy-500 text-sm text-center py-8">No notes yet</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-navy-900 border border-navy-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center">
                  <span className="text-gold-400 text-sm font-bold">
                    {(note.user_name || "U")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-white text-sm font-medium">{note.user_name}</span>
                  <span className="text-navy-500 text-xs ml-2">
                    {new Date(note.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-navy-200 text-sm leading-relaxed whitespace-pre-wrap pl-11">
                {note.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
