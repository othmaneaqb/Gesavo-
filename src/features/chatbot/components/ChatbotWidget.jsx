import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import { chatbotService } from "@/services/chatbot.service";

const copy = {
  fr: {
    initial: "Bonjour, je suis l\u2019assistant du cabinet. Posez votre question dans la langue que vous voulez. Je peux consulter les donn\u00e9es autoris\u00e9es et proposer certaines actions avec confirmation.",
    title: "Assistant cabinet",
    lawyer: "Acc\u00e8s complet autoris\u00e9",
    assistant: "Finance masqu\u00e9e selon votre r\u00f4le",
    local: "Donn\u00e9es cabinet",
    actionTitle: "Action propos\u00e9e",
    applying: "Application\u2026",
    confirm: "Confirmer",
    loading: "Analyse des donn\u00e9es du cabinet\u2026",
    placeholder: "Posez une question libre\u2026",
    send: "Envoyer",
    expired: "Votre session a expir\u00e9. Veuillez vous reconnecter.",
    unavailable: "Je n\u2019ai pas pu contacter le service chatbot pour le moment.",
    actionDoneSuffix: "Les donn\u00e9es ont \u00e9t\u00e9 modifi\u00e9es. Si la page actuelle affiche une ancienne liste, rechargez ou revenez sur le module concern\u00e9 pour voir la mise \u00e0 jour.",
    actionFailed: "L\u2019action n\u2019a pas pu \u00eatre ex\u00e9cut\u00e9e.",
    close: "Fermer",
    icon: "\uD83D\uDCAC",
    suggestions: [
      "Quelles t\u00e2ches sont en retard ?",
      "Quelles audiences cette semaine ?",
      "Cr\u00e9e une t\u00e2che pr\u00e9parer les pi\u00e8ces",
      "Ajoute une note v\u00e9rifier le dossier",
    ],
  },
  en: {
    initial: "Hello, I am the firm assistant. Ask in your own language. I can use authorized firm data and propose actions with confirmation.",
    title: "Firm assistant",
    lawyer: "Full access authorized",
    assistant: "Finance hidden according to your role",
    local: "Firm database",
    actionTitle: "Proposed action",
    applying: "Applying\u2026",
    confirm: "Confirm",
    loading: "Analyzing firm data\u2026",
    placeholder: "Ask any question\u2026",
    send: "Send",
    expired: "Your session expired. Please sign in again.",
    unavailable: "I could not reach the chatbot service right now.",
    actionDoneSuffix: "The data has been modified. If the current page shows an old list, refresh or return to the relevant module to see the update.",
    actionFailed: "The action could not be executed.",
    close: "Close",
    icon: "\uD83D\uDCAC",
    suggestions: [
      "Which tasks are overdue?",
      "Which hearings are this week?",
      "Create a task prepare documents",
      "Add a note review the case",
    ],
  },
  ar: {
    initial: "\u0645\u0631\u062d\u0628\u0627\u064b\u060c \u0623\u0646\u0627 \u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0645\u0643\u062a\u0628. \u064a\u0645\u0643\u0646\u0643 \u0637\u0631\u062d \u0633\u0624\u0627\u0644\u0643 \u0628\u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u062a\u064a \u062a\u0631\u064a\u062f. \u0623\u0633\u062a\u0639\u0645\u0644 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u0645\u0648\u062d \u0628\u0647\u0627 \u0648\u0623\u0642\u062a\u0631\u062d \u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0628\u0639\u062f \u0627\u0644\u062a\u0623\u0643\u064a\u062f.",
    title: "\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0645\u0643\u062a\u0628",
    lawyer: "\u0648\u0635\u0648\u0644 \u0643\u0627\u0645\u0644 \u0645\u0633\u0645\u0648\u062d",
    assistant: "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u0645\u062e\u0641\u064a\u0629 \u062d\u0633\u0628 \u062f\u0648\u0631\u0643",
    local: "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0643\u062a\u0628",
    actionTitle: "\u0625\u062c\u0631\u0627\u0621 \u0645\u0642\u062a\u0631\u062d",
    applying: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0637\u0628\u064a\u0642\u2026",
    confirm: "\u062a\u0623\u0643\u064a\u062f",
    loading: "\u062c\u0627\u0631\u064a \u062a\u062d\u0644\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0643\u062a\u0628\u2026",
    placeholder: "\u0627\u0637\u0631\u062d \u0623\u064a \u0633\u0624\u0627\u0644\u2026",
    send: "\u0625\u0631\u0633\u0627\u0644",
    expired: "\u0627\u0646\u062a\u0647\u062a \u0627\u0644\u062c\u0644\u0633\u0629. \u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0646 \u062c\u062f\u064a\u062f.",
    unavailable: "\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u062e\u062f\u0645\u0629 \u0627\u0644\u0645\u0633\u0627\u0639\u062f \u062d\u0627\u0644\u064a\u0627\u064b.",
    actionDoneSuffix: "\u062a\u0645 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a. \u0625\u0630\u0627 \u0643\u0627\u0646\u062a \u0627\u0644\u0635\u0641\u062d\u0629 \u062a\u0639\u0631\u0636 \u0642\u0627\u0626\u0645\u0629 \u0642\u062f\u064a\u0645\u0629\u060c \u0642\u0645 \u0628\u0627\u0644\u062a\u062d\u062f\u064a\u062b \u0623\u0648 \u0627\u0631\u062c\u0639 \u0625\u0644\u0649 \u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0645\u0639\u0646\u064a.",
    actionFailed: "\u062a\u0639\u0630\u0631 \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0625\u062c\u0631\u0627\u0621.",
    close: "\u0625\u063a\u0644\u0627\u0642",
    icon: "\u2696\uFE0F",
    suggestions: [
      "\u0645\u0627 \u0647\u064a \u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0645\u062a\u0623\u062e\u0631\u0629\u061f",
      "\u0645\u0627 \u0647\u064a \u0627\u0644\u062c\u0644\u0633\u0627\u062a \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u061f",
      "\u0623\u0646\u0634\u0626 \u0645\u0647\u0645\u0629 \u0644\u062a\u062d\u0636\u064a\u0631 \u0627\u0644\u0648\u062b\u0627\u0626\u0642",
      "\u0623\u0636\u0641 \u0645\u0644\u0627\u062d\u0638\u0629 \u062d\u0648\u0644 \u0627\u0644\u0645\u0644\u0641",
    ],
  },
};

export default function ChatbotWidget({ user }) {
  const { language, isRtl } = useI18n();
  const c = copy[language] || copy.fr;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: c.initial }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const listRef = useRef(null);

  const visibleHistory = useMemo(() => messages.slice(-8).map(item => ({
    role: item.role,
    content: item.content,
  })), [messages]);

  const scrollToBottom = () => {
    window.setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 30);
  };

  const appendAssistant = message => {
    setMessages(prev => [...prev, { role: "assistant", ...message }]);
    scrollToBottom();
  };

  const send = async (text = input) => {
    const clean = text.trim();
    if (!clean || loading) return;

    setMessages(prev => [...prev, { role: "user", content: clean }]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const result = await chatbotService.sendMessage({ message: clean, language, history: visibleHistory });
      appendAssistant({
        content: result.answer,
        mode: result.mode,
        sources: result.sources,
        actions: result.actions || [],
      });
    } catch (error) {
      const status = error.response?.status;
      appendAssistant({ content: status === 401 ? c.expired : c.unavailable });
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async (action, messageIndex) => {
    const actionKey = `${messageIndex}-${action.type}`;
    setActionLoading(actionKey);
    try {
      const result = await chatbotService.executeAction(action, language);
      setMessages(prev => prev.map((item, index) => index === messageIndex
        ? { ...item, actions: (item.actions || []).filter(existing => existing !== action) }
        : item));
      appendAssistant({ content: `${result.detail}\n\n${c.actionDoneSuffix}` });
    } catch (error) {
      appendAssistant({ content: error.response?.data?.detail || c.actionFailed });
    } finally {
      setActionLoading(null);
    }
  };

  const onSubmit = event => {
    event.preventDefault();
    send();
  };

  return (
    <div className={`chatbot ${open ? "open" : ""} ${isRtl ? "rtl-chatbot" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
      {open && (
        <section className="chatbot-panel" aria-label={c.title}>
          <header className="chatbot-header">
            <div>
              <strong>{c.title}</strong>
              <span>{user?.role === "LAWYER" ? c.lawyer : c.assistant}</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={c.close}>×</button>
          </header>

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
                <div>{message.content}</div>
                {message.role === "assistant" && message.mode && (
                  <small>{c.local}</small>
                )}
                {message.role === "assistant" && message.actions?.length > 0 && (
                  <div className="chat-actions">
                    <strong>{c.actionTitle}</strong>
                    {message.actions.map(action => {
                      const key = `${index}-${action.type}`;
                      return (
                        <button
                          key={`${action.type}-${action.label}`}
                          type="button"
                          onClick={() => confirmAction(action, index)}
                          disabled={Boolean(actionLoading)}
                        >
                          {actionLoading === key ? c.applying : `${c.confirm} ? ${action.label}`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="chat-message assistant"><div>{c.loading}</div></div>}
          </div>

          <div className="chatbot-suggestions">
            {c.suggestions.map(item => (
              <button key={item} type="button" onClick={() => send(item)} disabled={loading}>{item}</button>
            ))}
          </div>

          <form className="chatbot-form" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={c.placeholder}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>{c.send}</button>
          </form>
        </section>
      )}

      <button className="chatbot-toggle" type="button" onClick={() => setOpen(prev => !prev)} aria-label={c.title}>
        <span>{c.icon}</span>
      </button>
    </div>
  );
}
