
import React from 'react';
import { Quest, QuestDifficulty, QuestType } from '../types';
import { Camera, MapPin, Type, ListChecks, Heart, CheckCircle, ArrowRight, X } from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  onSelect: (quest: Quest) => void;
  onSave: (id: string) => void;
  onShare: (quest: Quest) => void;
  onSkip?: (id: string) => void;
}

const DifficultyBadge = ({ level }: { level: QuestDifficulty }) => {
  const styles: Record<QuestDifficulty, string> = {
    [QuestDifficulty.EASY]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    [QuestDifficulty.MEDIUM]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    [QuestDifficulty.HARD]: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };
  return (
    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${styles[level]}`}>
      {level}
    </span>
  );
};

const QuestCard: React.FC<QuestCardProps> = ({ quest, onSelect, onSave, onShare, onSkip }) => {
  const isCompleted = quest.completed;

  if (isCompleted) {
    return (
      <button 
        onClick={() => onSelect(quest)}
        className="glass w-full p-4 flex items-center justify-between transition-all hover:bg-white/[0.03] text-left">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-emerald-500/10 rounded-lg text-emerald-400">
            <CheckCircle size={16} />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">{quest.title}</h3>
            <p className="text-[10px] text-zinc-500 font-medium">Mission Completed</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="xp-badge shrink-0">+{quest.points} XP</span>
          <div 
            onClick={(e) => { e.stopPropagation(); onSave(quest.id); }}
            className={`p-1.5 rounded-lg transition-all ${quest.saved ? 'text-rose-500 bg-rose-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}>
            <Heart size={16} fill={quest.saved ? "currentColor" : "none"} />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="relative animate-in">
      <div className="glass p-5 flex flex-col gap-4 h-full border-white/5 transition-all hover:border-white/10">
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-xl text-zinc-200">
              {quest.type === QuestType.IMAGE && <Camera size={20} />}
              {quest.type === QuestType.TEXT && <Type size={20} />}
              {quest.type === QuestType.LOCATION && <MapPin size={20} />}
              {quest.type === QuestType.CHOICE && <ListChecks size={20} />}
            </div>
            <div className="flex items-center gap-2">
              <DifficultyBadge level={quest.difficulty} />
              <span className="xp-badge">+{quest.points} XP</span>
            </div>
          </div>
          
          {onSkip && (
            <button 
              onClick={(e) => { e.stopPropagation(); onSkip(quest.id); }}
              className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors bg-white/5 rounded-lg"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-bold text-white leading-tight">{quest.title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed font-normal line-clamp-2">{quest.description}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onSave(quest.id); }}
              className={`p-2 rounded-lg transition-all ${quest.saved ? 'text-rose-500 bg-rose-500/10' : 'text-zinc-500 hover:text-white'}`}>
              <Heart size={20} fill={quest.saved ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onShare(quest); }}
              className="p-2 text-zinc-500 hover:text-white transition-all">
              <ArrowRight className="rotate-[-45deg]" size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => onSelect(quest)}
            className="flex items-center gap-2 px-5 py-2.5 btn-primary rounded-xl font-bold text-sm">
            Deploy <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestCard;
