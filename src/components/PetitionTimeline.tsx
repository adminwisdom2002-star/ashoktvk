import React, { useState, useEffect } from 'react';
import { PetitionStatus } from '../types';
import { FileText, Clock, Wrench, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';

interface PetitionTimelineProps {
  status: PetitionStatus;
  createdAt: string;
  updatedAt?: string;
  officialNote?: string;
}

interface TimelineStep {
  key: PetitionStatus;
  titleTa: string;
  titleEn: string;
  description: string;
  icon: React.ElementType;
  percentage: number;
}

export const PetitionTimeline: React.FC<PetitionTimelineProps> = ({
  status,
  createdAt,
  updatedAt,
  officialNote
}) => {
  const steps: TimelineStep[] = [
    {
      key: 'pending',
      titleTa: '1. மனு பதிவு',
      titleEn: 'Petition Received',
      description: 'மனு பெறப்பட்டு TVK சேவை மையப் பதிவேட்டில் பதிவு செய்யப்பட்டது.',
      icon: FileText,
      percentage: 25
    },
    {
      key: 'in_progress',
      titleTa: '2. பரிசீலனை & கள ஆய்வு',
      titleEn: 'In Review & Inspection',
      description: 'TVK வார்டு பொறுப்பாளர் கள ஆய்வு மேற்கொண்டு அதிகாரிகளின் கவனத்திற்கு கொண்டு செல்லப்படுகிறது.',
      icon: Clock,
      percentage: 50
    },
    {
      key: 'action_taken',
      titleTa: '3. அரசு நடவடிக்கை',
      titleEn: 'Official Action Taken',
      description: 'பேரூராட்சி மற்றும் துறை அதிகாரிகளுடன் நேரடி நடவடிக்கை மேற்கொள்ளப்படுகிறது.',
      icon: Wrench,
      percentage: 75
    },
    {
      key: 'resolved',
      titleTa: '4. பிரச்சனை தீர்க்கப்பட்டது',
      titleEn: 'Resolved & Closed',
      description: 'கோரிக்கை முற்றிலும் நிறைவேற்றப்பட்டு பிரச்சனை வெற்றிகரமாகத் தீர்க்கப்பட்டது.',
      icon: CheckCircle2,
      percentage: 100
    }
  ];

  const getStepIndex = (st: PetitionStatus): number => {
    switch (st) {
      case 'resolved': return 3;
      case 'action_taken': return 2;
      case 'in_progress': return 1;
      case 'pending':
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const targetPercentage = steps[currentIndex].percentage;

  // Animated width state for smooth transition on mount/update
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Reset to 0 then animate to target for a smooth fill effect
    const timer = setTimeout(() => {
      setAnimatedProgress(targetPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetPercentage, status]);

  const createdDateStr = new Date(createdAt).toLocaleDateString('ta-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const updatedDateStr = updatedAt ? new Date(updatedAt).toLocaleDateString('ta-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : createdDateStr;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-sm overflow-hidden">
      
      {/* Header & Status Percentage Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-[#4a0000] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4a0000]" />
            <span>மனு நிலைப்பாடு காலாண்டு முறைமை (Status Progress)</span>
          </h4>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            மனுவின் நேரடி முன்னேற்றம் மற்றும் செயல்பாடுகளின் அனிமேஷன் காட்சி வடிவம்
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Progress Percentage Badge */}
          <span className="bg-[#4a0000] text-[#ffcc00] text-xs font-black px-3 py-1 rounded-full shadow-2xs flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{animatedProgress}% நிறைவேறியது</span>
          </span>

          <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
            status === 'resolved' 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : status === 'action_taken'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : status === 'in_progress'
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
          }`}>
            {status === 'resolved' && '✓ பிரச்சனை தீர்க்கப்பட்டது'}
            {status === 'action_taken' && '⚡ அரசு நடவடிக்கை'}
            {status === 'in_progress' && '🔍 கள ஆய்வு & பரிசீலனை'}
            {status === 'pending' && '📋 மனு பெறப்பட்டது'}
          </span>
        </div>
      </div>

      {/* Main Animated Progress Line Container */}
      <div className="my-6">
        
        {/* Continuous Top Progress Bar with Smooth Pulse Shimmer */}
        <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-neutral-200 shadow-inner mb-6 relative">
          <div 
            className="h-full bg-gradient-to-r from-[#4a0000] via-amber-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out relative shadow-sm"
            style={{ width: `${animatedProgress}%` }}
          >
            {/* Glowing animated tip */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/80 rounded-full animate-pulse shadow-md"></div>
          </div>
        </div>

        {/* Desktop / Tablet Step Progress Nodes */}
        <div className="relative">
          
          {/* Horizontal Track Line behind nodes */}
          <div className="hidden sm:block absolute top-5 left-[12.5%] right-[12.5%] h-1 bg-neutral-200 -z-0">
            <div 
              className="h-full bg-gradient-to-r from-[#4a0000] via-amber-500 to-emerald-600 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
            {steps.map((step, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              const IconComponent = step.icon;

              return (
                <div 
                  key={step.key} 
                  className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-left sm:text-center group"
                >
                  {/* Node Circle */}
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 flex-shrink-0 shadow-md relative ${
                      isCurrent
                        ? 'bg-[#4a0000] text-[#ffcc00] ring-4 ring-[#ffcc00]/50 scale-110 shadow-lg'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-100 text-neutral-400 border border-neutral-300'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${isCurrent ? 'animate-bounce' : ''}`} />

                    {/* Stage Checkmark overlay for completed steps */}
                    {isPassed && (
                      <div className="absolute -bottom-1 -right-1 bg-white text-emerald-600 rounded-full p-0.5 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="flex-1">
                    <div className="flex items-center sm:justify-center gap-1">
                      <span className={`text-xs font-extrabold ${
                        isCurrent 
                          ? 'text-[#4a0000]' 
                          : isPassed 
                          ? 'text-emerald-800' 
                          : 'text-neutral-500'
                      }`}>
                        {step.titleTa}
                      </span>
                    </div>

                    <span className="text-[10px] text-neutral-400 font-mono block">
                      {step.titleEn}
                    </span>

                    <p className="text-[11px] text-neutral-600 leading-tight mt-1 hidden sm:block">
                      {step.description}
                    </p>

                    <div className="mt-1 flex items-center justify-start sm:justify-center gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isCurrent ? 'bg-[#ffcc00]/20 text-[#4a0000]' : 'text-neutral-400'
                      }`}>
                        {step.percentage}% நிலையடைவு
                      </span>
                    </div>

                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      {idx === 0 && `தேதி: ${createdDateStr}`}
                      {idx === currentIndex && idx > 0 && `புதுப்பிப்பு: ${updatedDateStr}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Vertical Detailed Log View for Mobile Screen */}
      <div className="sm:hidden border-t border-neutral-200 pt-3 space-y-2.5">
        {steps.map((step, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          if (idx > currentIndex) return null; // Show up to current active step in mobile log view

          return (
            <div key={step.key} className="flex gap-2.5 text-xs bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
              <div className="mt-0.5">
                {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                {isCurrent && <AlertCircle className="w-4 h-4 text-[#4a0000] flex-shrink-0 animate-pulse" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-neutral-900 block">{step.titleTa} ({step.titleEn})</span>
                  <span className="text-[10px] font-bold text-[#4a0000] bg-[#ffcc00] px-1.5 py-0.2 rounded-full">
                    {step.percentage}%
                  </span>
                </div>
                <p className="text-neutral-600 text-[11px] mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {officialNote && (
        <div className="mt-3 pt-3 border-t border-neutral-200 text-xs flex items-start gap-2 bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block text-emerald-950">அரசு / தவெக அதிகாரப்பூர்வ குறிப்பு (Official Note):</span>
            <span className="font-medium text-emerald-900">{officialNote}</span>
          </div>
        </div>
      )}
    </div>
  );
};

