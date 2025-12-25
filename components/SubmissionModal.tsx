
import React, { useState, useRef } from 'react';
import { Quest, QuestType } from '../types';
import { X, Camera, Send, Loader2, CheckCircle, AlertTriangle, ArrowRight, User, Brain } from 'lucide-react';

interface SubmissionModalProps {
  quest: Quest;
  onClose: () => void;
  onSubmit?: (submission: { text?: string; imageBase64?: string }) => Promise<{ success: boolean; feedback: string }>;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({ quest, onClose, onSubmit }) => {
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Fix: changed 'text' to 'feedback' to match the return type of the verification service
  const [verdict, setVerdict] = useState<{ success: boolean; feedback: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHistoryMode = !!quest.completed;

  // Validation
  const canSubmit = () => {
    if (quest.type === QuestType.IMAGE) return !!image;
    if (quest.type === QuestType.TEXT) return inputText.trim().length > 5;
    if (quest.type === QuestType.CHOICE) return !!inputText;
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async () => {
    if (!onSubmit || !canSubmit()) return;
    
    setIsSubmitting(true);
    try {
      const response = await onSubmit({
        text: inputText,
        imageBase64: image ? image.split(',')[1] : undefined
      });
      setVerdict(response);
    } catch (error) {
      alert("Something went wrong with verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // History Detail View
  if (isHistoryMode) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in">
        <div className="glass max-w-md w-full p-8 flex flex-col gap-6 shadow-2xl relative">
          <button onClick={onClose} className="absolute right-6 top-6 p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
          
          <div className="space-y-1 pr-6">
            <h2 className="text-xl font-bold text-white">{quest.title}</h2>
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Mission Logged • {new Date(quest.timestamp).toLocaleDateString()}</p>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <User size={14} /> Your Submission
              </div>
              <p className="text-zinc-200 text-sm italic">
                {quest.userSubmission || "No text content available."}
              </p>
            </div>

            <div className="space-y-2 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Brain size={14} /> AI Feedback
              </div>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                {quest.aiFeedback || "Mission accepted by system."}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="w-full py-4 bg-zinc-800 text-white rounded-xl font-bold text-sm transition-all hover:bg-zinc-700">
            Close Archive
          </button>
        </div>
      </div>
    );
  }

  // Verification Screen after Submit
  if (verdict) {
    return (
      <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in">
        <div className="glass max-w-md w-full p-8 flex flex-col items-center text-center gap-6 shadow-2xl border border-emerald-500/20">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${verdict.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {verdict.success ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
          </div>
          <div className="space-y-2">
            <h2 className={`text-xl font-bold ${verdict.success ? 'text-emerald-400' : 'text-rose-400'}`}>
              {verdict.success ? 'Accepted' : 'Try Again'}
            </h2>
            {/* Fix: changed 'text' to 'feedback' to match the updated state */}
            <p className="text-zinc-300 text-sm leading-relaxed">{verdict.feedback}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-zinc-800 text-white rounded-xl font-bold text-sm transition-all">
            Continue <ArrowRight className="inline ml-2" size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in">
      <div className="glass max-w-lg w-full p-8 flex flex-col gap-6 relative shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
        <button onClick={onClose} className="absolute right-6 top-6 p-2 text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="space-y-2 pr-8">
          <h2 className="text-xl font-bold text-white leading-snug">{quest.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed font-medium">{quest.description}</p>
        </div>

        <div className="space-y-4">
          {quest.type === QuestType.TEXT && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Write your proof</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Share your experience (be creative)..."
                className="w-full h-40 p-4 bg-zinc-900 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none text-white text-sm transition-all"
              />
            </div>
          )}

          {quest.type === QuestType.IMAGE && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Capture Proof</label>
              <div className="aspect-video bg-zinc-900 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center gap-3">
                {image ? (
                  <img src={image} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={32} className="text-zinc-700" />
                    <span className="text-zinc-600 text-xs font-medium">No image selected</span>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-zinc-800 text-zinc-200 rounded-xl font-bold text-sm transition-all hover:bg-zinc-700">
                {image ? 'Change Photo' : 'Take Photo'}
              </button>
            </div>
          )}

          {quest.type === QuestType.CHOICE && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Select Answer</label>
              <div className="grid gap-2">
                {quest.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(opt)}
                    className={`p-4 text-left border rounded-xl font-bold text-sm transition-all ${inputText === opt ? 'bg-blue-600 border-blue-400 text-white' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          disabled={isSubmitting || !canSubmit()}
          onClick={handleFinalSubmit}
          className="w-full py-4 btn-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-20 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Finish Quest</>}
        </button>
      </div>
    </div>
  );
};

export default SubmissionModal;
