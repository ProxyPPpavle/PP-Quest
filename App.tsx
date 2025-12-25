
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Quest, UserProfile, QuestDifficulty, QuestType, Language } from './types';
import { generateDailyQuests, verifySubmission } from './geminiService';
import QuestCard from './components/QuestCard';
import SubmissionModal from './components/SubmissionModal';
import { Trophy, Zap, History, BarChart3, LayoutGrid, Crown, RefreshCcw, Share2, Heart, Medal, CheckCircle, ArrowRight, Languages } from 'lucide-react';

const translations: Record<Language, any> = {
  en: {
    sync: "Network Synchronized",
    premium: "Premium Active",
    goPremium: "Go Premium",
    skips: "Skips Available",
    resets: "Resets Left",
    pending: "PENDING",
    available: "Deployments",
    stats: "Profile Intelligence",
    share: "Share Stats",
    cleared: "Quests",
    streak: "Streak",
    peak: "Peak",
    details: "Clearance Details",
    archive: "Mission Archive",
    grid: "Grid",
    intel: "Intel",
    logs: "LOGS",
    copied: "Link copied to clipboard!"
  },
  sr: {
    sync: "Mreža Sinhronizovana",
    premium: "Premium Aktivan",
    goPremium: "Postani Premium",
    skips: "Preskakanja",
    resets: "Resetovanja",
    pending: "NA ČEKANJU",
    available: "Zadaci",
    stats: "Profil Inteligencije",
    share: "Podeli Statistiku",
    cleared: "Zadaci",
    streak: "Niz",
    peak: "Vrh",
    details: "Detalji Čišćenja",
    archive: "Arhiva Misija",
    grid: "Mreža",
    intel: "Info",
    logs: "ZAPISI",
    copied: "Link kopiran u clipboard!"
  },
  es: {
    sync: "Red Sincronizada",
    premium: "Premium Activo",
    goPremium: "Hacerse Premium",
    skips: "Saltos",
    resets: "Reinicios",
    pending: "PENDIENTE",
    available: "Despliegues",
    stats: "Inteligencia de Perfil",
    share: "Compartir Estadísticas",
    cleared: "Misiones",
    streak: "Racha",
    peak: "Pico",
    details: "Detalles de Limpieza",
    archive: "Archivo de Misiones",
    grid: "Cuadrícula",
    intel: "Intel",
    logs: "REGISTROS",
    copied: "¡Enlace copiado!"
  },
  fr: {
    sync: "Réseau Synchronisé",
    premium: "Premium Actif",
    goPremium: "Devenir Premium",
    skips: "Sauts",
    resets: "Réinitialisations",
    pending: "EN ATTENTE",
    available: "Déploiements",
    stats: "Intelligence du Profil",
    share: "Partager les Stats",
    cleared: "Quêtes",
    streak: "Série",
    peak: "Sommet",
    details: "Détails du Nettoyage",
    archive: "Archives des Missions",
    grid: "Grille",
    intel: "Intel",
    logs: "JOURNAUX",
    copied: "Lien copié!"
  }
};

const INITIAL_PROFILE: UserProfile = {
  username: "New Agent",
  stats: {
    completedCount: 0,
    completedEasy: 0,
    completedMedium: 0,
    completedHard: 0,
    lostCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalPoints: 0
  },
  isPremium: false,
  dailySkips: 1,
  language: 'en',
  lastRefreshTimestamp: 0,
  history: []
};

const App: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'stats' | 'history'>('home');

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const savedProfile = localStorage.getItem('pp_quest_v6_profile');
    const savedQuests = localStorage.getItem('pp_quest_v6_daily');
    
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    
    if (savedQuests) {
      setQuests(JSON.parse(savedQuests));
      setLoading(false);
    } else {
      handleRefreshQuests();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pp_quest_v6_profile', JSON.stringify(profile));
    localStorage.setItem('pp_quest_v6_daily', JSON.stringify(quests));
  }, [profile, quests]);

  const t = translations[profile.language] || translations['en'];

  const showToast = (message?: string) => {
    const toast = document.getElementById("toast");
    if (toast) {
      if (message) toast.innerText = message;
      toast.className = "show";
      setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
    }
  };

  const handleRefreshQuests = async (isManual = false) => {
    // If manual reset, check limits based on premium (2 resets) vs free (none - free only gets 1 skip)
    // Actually, following prompt: Premium gets 2 instant resets daily.
    if (isManual) {
      if (!profile.isPremium) {
        alert("Resets are for Premium agents only! Use Skips instead.");
        return;
      }
      if (profile.dailySkips <= 0) {
        alert("Daily reset limit reached!");
        return;
      }
    }

    setLoading(true);
    const newQuests = await generateDailyQuests(profile.language);
    setQuests(newQuests);
    setProfile(prev => ({ 
      ...prev, 
      lastRefreshTimestamp: Date.now(),
      dailySkips: isManual ? prev.dailySkips - 1 : prev.dailySkips
    }));
    setLoading(false);
  };

  const handleSkipQuest = async (id: string) => {
    if (profile.dailySkips > 0 || profile.isPremium) {
      setQuests(prev => prev.filter(q => q.id !== id));
      const replacement = await generateDailyQuests(profile.language);
      setQuests(prev => [...prev, replacement[0]]);
      setProfile(prev => ({ 
        ...prev, 
        dailySkips: prev.dailySkips - 1 
      }));
    } else {
      alert("No skips left!");
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setProfile(prev => ({ ...prev, language: lang }));
    // Optionally refresh quests in new language
    handleRefreshQuests(false);
  };

  const handleQuestSave = (id: string) => {
    setQuests(prev => prev.map(q => q.id === id ? { ...q, saved: !q.saved } : q));
    setProfile(prev => ({
      ...prev,
      history: prev.history.map(h => h.id === id ? { ...h, saved: !h.saved } : h)
    }));
  };

  const handleShare = async (data: any, isStats = false) => {
    let shareText = "";
    if (isStats) {
      shareText = `My PP Quest Stats: Cleared ${profile.stats.completedCount} quests, reached ${profile.stats.totalPoints} XP. Join me!`;
    } else {
      shareText = `Check out this quest: "${data.title}" on PP Quest!`;
    }
    
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PP Quest',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        showToast(t.copied);
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      showToast(t.copied);
    }
  };

  const handleSubmission = async (submission: { text?: string; imageBase64?: string }) => {
    if (!activeQuest) throw new Error("No active quest");
    const result = await verifySubmission(activeQuest, submission, profile.language);
    
    if (result.success) {
      const completedQuest: Quest = { 
        ...activeQuest, 
        completed: true, 
        timestamp: Date.now(),
        userSubmission: submission.text || (submission.imageBase64 ? "Image Proof Sent" : undefined),
        aiFeedback: result.feedback
      };
      
      setQuests(prev => prev.map(q => q.id === activeQuest.id ? completedQuest : q));
      setProfile(prev => {
        const diff = activeQuest.difficulty;
        return {
          ...prev,
          history: [completedQuest, ...prev.history],
          stats: {
            ...prev.stats,
            totalPoints: prev.stats.totalPoints + activeQuest.points,
            completedCount: prev.stats.completedCount + 1,
            completedEasy: diff === QuestDifficulty.EASY ? prev.stats.completedEasy + 1 : prev.stats.completedEasy,
            completedMedium: diff === QuestDifficulty.MEDIUM ? prev.stats.completedMedium + 1 : prev.stats.completedMedium,
            completedHard: diff === QuestDifficulty.HARD ? prev.stats.completedHard + 1 : prev.stats.completedHard,
            currentStreak: prev.stats.currentStreak + 1,
            bestStreak: Math.max(prev.stats.bestStreak, prev.stats.currentStreak + 1)
          }
        };
      });
    }
    return result;
  };

  const pendingCount = quests.filter(q => !q.completed).length;

  const renderHome = () => (
    <div className="space-y-6 animate-in">
      <div className="p-6 glass border-emerald-500/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
            {profile.username[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              {profile.username} {profile.isPremium && <Crown size={16} className="text-amber-400" />}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-28 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(profile.stats.totalPoints % 500) / 5}%` }} />
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{profile.stats.totalPoints % 500}/500 XP</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-center p-2.5 px-5 glass bg-white/5">
             <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
               {profile.isPremium ? t.resets : t.skips}
             </p>
             <div className="flex gap-1.5 justify-center">
               {[...Array(profile.isPremium ? 2 : 1)].map((_, i) => (
                 <div key={i} className={`w-2 h-2 rounded-full ${i < profile.dailySkips ? 'bg-emerald-400' : 'bg-zinc-800'}`} />
               ))}
             </div>
          </div>
          <button onClick={() => handleRefreshQuests(true)} className="p-3.5 glass hover:bg-white/10 transition-colors">
            <RefreshCcw size={20} className={loading ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t.available}</h3>
          <span className="xp-badge">{pendingCount} {t.pending}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-44 glass animate-pulse" />)
          ) : (
            quests.map(quest => (
              <QuestCard 
                key={quest.id} 
                quest={quest} 
                onSelect={setActiveQuest} 
                onSave={handleQuestSave}
                onShare={handleShare}
                onSkip={handleSkipQuest}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-8 animate-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t.stats}</h2>
        <button onClick={() => handleShare(null, true)} className="flex items-center gap-2 px-4 py-2 glass font-bold text-xs uppercase tracking-wider">
          <Share2 size={16} /> {t.share}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: <CheckCircle className="text-emerald-400" />, val: profile.stats.completedCount, label: t.cleared },
          { icon: <Medal className="text-blue-400" />, val: profile.stats.totalPoints, label: 'XP Points' },
          { icon: <Zap className="text-amber-400" />, val: profile.stats.currentStreak, label: t.streak },
          { icon: <Trophy className="text-rose-400" />, val: profile.stats.bestStreak, label: t.peak },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 text-center space-y-2 border-white/5">
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <p className="text-2xl font-bold">{stat.val}</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass p-6 space-y-5">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t.details}</h3>
        <div className="space-y-4">
          {[
            { label: 'Easy Missions', count: profile.stats.completedEasy, color: 'bg-emerald-500' },
            { label: 'Medium Missions', count: profile.stats.completedMedium, color: 'bg-blue-500' },
            { label: 'Hard Missions', count: profile.stats.completedHard, color: 'bg-rose-500' },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                <span className="text-zinc-400">{item.label}</span>
                <span>{item.count}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${item.color}`} style={{ width: `${(item.count / (profile.stats.completedCount || 1)) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t.archive}</h2>
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{profile.history.length} {t.logs}</span>
      </div>
      <div className="space-y-3">
        {profile.history.length > 0 ? (
          profile.history.map((quest, i) => (
            <QuestCard key={i} quest={quest} onSelect={setActiveQuest} onSave={handleQuestSave} onShare={handleShare} />
          ))
        ) : (
          <div className="text-center py-24 opacity-30">
            <History size={48} className="mx-auto mb-4" />
            <p className="font-bold text-xs tracking-widest uppercase">No past deployments</p>
          </div>
        )}
      </div>
    </div>
  );

  const togglePremium = () => {
    setProfile(prev => ({ 
      ...prev, 
      isPremium: !prev.isPremium,
      dailySkips: !prev.isPremium ? 2 : 1 // Reset counter on toggle for demo
    }));
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-6 pb-36">
      <header className="mb-10 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">PP QUEST</h1>
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">{t.sync}</p>
          </div>
          {/* Language Selector */}
          <div className="flex items-center gap-2 mt-2">
            <Languages size={14} className="text-zinc-500" />
            <div className="flex gap-2">
              {(['en', 'sr', 'es', 'fr'] as Language[]).map(lang => (
                <button 
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${profile.language === lang ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button 
          onClick={togglePremium}
          className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all ${profile.isPremium ? 'bg-amber-400 text-black' : 'bg-white/5 text-zinc-500'}`}>
          {profile.isPremium ? t.premium : t.goPremium}
        </button>
      </header>

      <main>
        {view === 'home' && renderHome()}
        {view === 'stats' && renderStats()}
        {view === 'history' && renderHistory()}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass p-2 flex gap-1 shadow-2xl z-50 border-white/10">
        <button onClick={() => setView('home')} className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${view === 'home' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <LayoutGrid size={18} strokeWidth={2.5} />
          <span className="text-[9px] font-bold uppercase tracking-wider mt-1">{t.grid}</span>
        </button>
        <button onClick={() => setView('stats')} className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${view === 'stats' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <BarChart3 size={18} strokeWidth={2.5} />
          <span className="text-[9px] font-bold uppercase tracking-wider mt-1">{t.intel}</span>
        </button>
        <button onClick={() => setView('history')} className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${view === 'history' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <History size={18} strokeWidth={2.5} />
          <span className="text-[9px] font-bold uppercase tracking-wider mt-1">{t.archive}</span>
        </button>
      </nav>

      {activeQuest && (
        <SubmissionModal quest={activeQuest} onClose={() => setActiveQuest(null)} onSubmit={activeQuest.completed ? undefined : handleSubmission} />
      )}
    </div>
  );
};

export default App;
