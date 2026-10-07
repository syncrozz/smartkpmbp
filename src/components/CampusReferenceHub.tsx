/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Link, 
  PhoneCall, 
  BookOpen, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  MessageCircle, 
  Bookmark, 
  Shield, 
  Compass 
} from 'lucide-react';
import { CampusLocationMap } from './CampusLocationMap';
import {
  LinkItem,
  CalendarEvent,
  ContactItem,
  RuleItem,
  QUICK_PORTAL_LINKS,
  CALENDAR_EVENTS,
  KEY_CAMPUS_CONTACTS,
  COLLEGE_RULES
} from '../data/campusReferenceData';

interface CampusReferenceHubProps {
  initialTab?: 'semua' | 'peta' | 'portal' | 'takwim' | 'bantuan' | 'panduan';
  hideTabBar?: boolean;
}

export const CampusReferenceHub: React.FC<CampusReferenceHubProps> = ({
  initialTab = 'semua',
  hideTabBar = false
}) => {
  const [activeRefTab, setActiveRefTab] = useState<'semua' | 'peta' | 'portal' | 'takwim' | 'bantuan' | 'panduan'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveRefTab(initialTab);
    }
  }, [initialTab]);

  const quickLinks: LinkItem[] = QUICK_PORTAL_LINKS;
  const calendarEvents: CalendarEvent[] = CALENDAR_EVENTS;
  const keyContacts: ContactItem[] = KEY_CAMPUS_CONTACTS;
  const collegeRules: RuleItem[] = COLLEGE_RULES;

  // Helper trigger action
  const handleAction = (type: 'call' | 'whatsapp' | 'email', item: ContactItem) => {
    if (type === 'call') {
      window.location.href = `tel:${item.phone}`;
    } else if (type === 'whatsapp') {
      const cleanWa = item.whatsapp.replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanWa.startsWith('6') ? cleanWa : '60' + cleanWa}`;
      window.open(waUrl, '_blank');
    } else if (type === 'email' && item.email) {
      window.location.href = `mailto:${item.email}`;
    }
  };

  // Searching logic
  const filteredLinks = quickLinks.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.audience.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCalendar = calendarEvents.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.dateRange.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = keyContacts.filter(item =>
    item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRules = collegeRules.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.details.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left">
      {/* Segmented Selector for reference types with soft pastel themes */}
      {!hideTabBar && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveRefTab('semua')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeRefTab === 'semua'
                ? 'bg-indigo-100/90 text-indigo-950 border-2 border-indigo-500 shadow-xs'
                : 'bg-indigo-50/70 text-indigo-800 hover:bg-indigo-100/70 border border-indigo-200/60'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${activeRefTab === 'semua' ? 'text-indigo-600' : 'text-indigo-500'}`} />
            Semua Sumber
          </button>
          <button
            onClick={() => setActiveRefTab('peta')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeRefTab === 'peta'
                ? 'bg-blue-100/90 text-blue-950 border-2 border-blue-500 shadow-xs'
                : 'bg-blue-50/70 text-blue-800 hover:bg-blue-100/70 border border-blue-200/60'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${activeRefTab === 'peta' ? 'text-blue-600' : 'text-blue-500'}`} />
            Peta Lokasi Kampus
          </button>
          <button
            onClick={() => setActiveRefTab('portal')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeRefTab === 'portal'
                ? 'bg-purple-100/90 text-purple-950 border-2 border-purple-500 shadow-xs'
                : 'bg-purple-50/70 text-purple-800 hover:bg-purple-100/70 border border-purple-200/60'
            }`}
          >
            <Link className={`w-3.5 h-3.5 ${activeRefTab === 'portal' ? 'text-purple-600' : 'text-purple-500'}`} />
            Pautan Penting & Portal
          </button>
          <button
            onClick={() => setActiveRefTab('takwim')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeRefTab === 'takwim'
                ? 'bg-emerald-100/90 text-emerald-950 border-2 border-emerald-500 shadow-xs'
                : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/60'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${activeRefTab === 'takwim' ? 'text-emerald-600' : 'text-emerald-500'}`} />
            Takwim Akademik
          </button>
          <button
            onClick={() => setActiveRefTab('bantuan')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeRefTab === 'bantuan'
                ? 'bg-rose-100/90 text-rose-950 border-2 border-rose-500 shadow-xs'
                : 'bg-rose-50/70 text-rose-800 hover:bg-rose-100/70 border border-rose-200/60'
            }`}
          >
            <PhoneCall className={`w-3.5 h-3.5 ${activeRefTab === 'bantuan' ? 'text-rose-600' : 'text-rose-500'}`} />
            Talian Bantuan & Warden
          </button>
          <button
            onClick={() => setActiveRefTab('panduan')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeRefTab === 'panduan'
                ? 'bg-amber-100/90 text-amber-950 border-2 border-amber-500 shadow-xs'
                : 'bg-amber-50/70 text-amber-800 hover:bg-amber-100/70 border border-amber-200/60'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${activeRefTab === 'panduan' ? 'text-amber-600' : 'text-amber-500'}`} />
            Panduan & Peraturan
          </button>
        </div>
      )}

      {/* Dynamic Content Panels based on Active Tab */}
      <div className="space-y-8">
        
        {/* SECTION: Campus Location Map */}
        {(activeRefTab === 'semua' || activeRefTab === 'peta') && (
          <CampusLocationMap />
        )}

        {/* SECTION: Quick Portals Links */}
        {(activeRefTab === 'semua' || activeRefTab === 'portal') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50/60 border border-indigo-100/40 flex items-center justify-center text-indigo-700 font-extrabold">
                <Link className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Pautan Penting & Portal Akademik ({filteredLinks.length})
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLinks.map((link) => (
                <div 
                  key={link.id} 
                  className="p-5.5 glass-card rounded-[24px] flex flex-col justify-between border border-white/55 shadow-sm hover:scale-[1.01] transition-transform duration-300"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${
                        link.audience === 'Pelajar' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : link.audience === 'Staf' 
                            ? 'bg-amber-50 text-amber-700 border-amber-100' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        Sesuai: {link.audience}
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <h4 className="font-sans font-extrabold text-slate-900 text-sm">{link.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{link.desc}</p>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                    >
                      Buka Portal <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
              {filteredLinks.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 col-span-full">
                  <p className="text-xs text-slate-500 font-semibold">Tiada maklumat tersedia buat masa ini.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION: Academic Calendar Events */}
        {(activeRefTab === 'semua' || activeRefTab === 'takwim') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50/60 border border-indigo-100/40 flex items-center justify-center text-indigo-700 font-extrabold">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Takwim Akademik Sesi 2026/2027 ({filteredCalendar.length})
              </h3>
            </div>

            <div className="glass-panel rounded-[26px] overflow-hidden border border-white/55 shadow-sm">
              <div className="divide-y divide-slate-100/80">
                {filteredCalendar.map((event) => {
                  const borderLColor = event.type === 'akademik' 
                    ? 'border-l-4 border-indigo-500' 
                    : event.type === 'cuti' 
                      ? 'border-l-4 border-rose-500' 
                      : 'border-l-4 border-emerald-500';

                  return (
                    <div 
                      key={event.id} 
                      className={`p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/50 transition-colors ${borderLColor}`}
                    >
                      <div className="flex items-start gap-3.5 text-left">
                        <div className="p-2.5 rounded-xl bg-white/80 border border-slate-100 text-indigo-700 shadow-2xs">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-sans font-extrabold text-slate-900 text-[13px]">{event.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{event.dateRange}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md border ${
                          event.type === 'akademik' 
                            ? 'bg-blue-50 text-blue-800 border-blue-100' 
                            : event.type === 'cuti' 
                              ? 'bg-red-50 text-red-800 border-red-100' 
                              : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        }`}>
                          {event.type.toUpperCase()}
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-md bg-white border border-slate-100 text-slate-600 flex items-center gap-1 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {event.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {filteredCalendar.length === 0 && (
                  <div className="p-8 text-center bg-slate-50">
                    <p className="text-xs text-slate-500 font-semibold">Tiada maklumat tersedia buat masa ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: Helpdesk & Warden Contacts */}
        {(activeRefTab === 'semua' || activeRefTab === 'bantuan') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50/60 border border-indigo-100/40 flex items-center justify-center text-indigo-700 font-extrabold">
                <PhoneCall className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Talian Bantuan Kampus, Kaunter & Warden ({filteredContacts.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className="p-5.5 glass-card rounded-[24px] flex flex-col justify-between border border-white/55 shadow-sm hover:scale-[1.01] transition-transform duration-300 text-left"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <h4 className="font-sans font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
                        {contact.department}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">{contact.role}</p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">{contact.phone}</span>
                      {contact.extension && (
                        <span className="text-xs font-mono font-extrabold text-indigo-700 bg-indigo-50/70 border border-indigo-100/50 px-2 py-0.5 rounded-lg">
                          ({contact.extension})
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action row with direct triggers */}
                  <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAction('call', contact)}
                      className="py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Hubungi
                    </button>
                    <button
                      onClick={() => handleAction('whatsapp', contact)}
                      className="py-2 rounded-xl border border-slate-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                    </button>
                  </div>
                </div>
              ))}
              {filteredContacts.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 col-span-full">
                  <p className="text-xs text-slate-500 font-semibold">Tiada maklumat tersedia buat masa ini.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION: Rules & Student Guide */}
        {(activeRefTab === 'semua' || activeRefTab === 'panduan') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50/60 border border-indigo-100/40 flex items-center justify-center text-indigo-700 font-extrabold">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Panduan Am, Polisi & Peraturan Kolej ({filteredRules.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {filteredRules.map((rule) => (
                <div 
                  key={rule.id} 
                  className="p-6.5 glass-card rounded-[26px] border border-white/55 shadow-sm bg-gradient-to-b from-white/70 to-white/40 hover:scale-[1.005] transition-all text-left"
                >
                  <div className="space-y-2 border-b border-slate-100 pb-3.5">
                    <h4 className="font-sans font-extrabold text-slate-900 text-sm flex items-center gap-2.5">
                      <Shield className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                      {rule.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">{rule.desc}</p>
                  </div>
                  <div className="mt-4.5 space-y-3">
                    {rule.details.map((detail, idx) => (
                      <div key={idx} className="flex gap-3 text-xs text-slate-600 font-semibold leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredRules.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-500 font-semibold">Tiada maklumat tersedia buat masa ini.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
