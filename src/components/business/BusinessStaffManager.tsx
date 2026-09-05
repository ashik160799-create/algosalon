import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffMember } from '../../types';
import { StaffAvatar } from '../common/StaffAvatar';
import {
  Plus,
  Star,
  Search,
  Clock,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  Sparkles,
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const BusinessStaffManager: React.FC = () => {
  const {
    businessUser,
    salons,
    staffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    currentThemeConfig,
    colorThemeMode,
    activeCountry,
  } = useApp();

  const isLight = colorThemeMode === 'light';
  const salon = salons.find(s => s.id === businessUser.salonId) || salons[0];
  const salonStaff = staffMembers.filter(s => s.salonId === salon?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState<string>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [roleTitle, setRoleTitle] = useState('Senior Barber & Stylist');
  const [phone, setPhone] = useState('+971 54 429 8306');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [specialtiesText, setSpecialtiesText] = useState('Skin Fades, Beard Sculpting, Hot Towel Shave');
  const [shiftHours, setShiftHours] = useState('09:00 AM - 07:00 PM');
  const [experienceYears, setExperienceYears] = useState(5);
  const [workingDays, setWorkingDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]);

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleOpenCreate = () => {
    setEditingStaffId(null);
    setName('');
    setGender('Male');
    setRoleTitle('Master Barber & Stylist');
    setPhone('+971 54 429 8306');
    setAvatar(AVATAR_PRESETS[0]);
    setSpecialtiesText('Skin Fades, Beard Sculpting, Hot Towel Shave');
    setShiftHours('09:00 AM - 07:00 PM');
    setExperienceYears(5);
    setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    setModalOpen(true);
  };

  const handleOpenEdit = (st: StaffMember) => {
    setEditingStaffId(st.id);
    setName(st.name);
    setGender(st.gender || 'Male');
    setRoleTitle(st.roleTitle);
    setPhone(st.phone || '+971 54 429 8306');
    setAvatar(st.avatar || AVATAR_PRESETS[0]);
    setSpecialtiesText(st.specialties.join(', '));
    setShiftHours(st.shiftHours || '09:00 AM - 07:00 PM');
    setExperienceYears(st.experienceYears || 5);
    setWorkingDays(st.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const specialties = specialtiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const staffData = {
      salonId: salon ? salon.id : businessUser.salonId,
      name: name.trim(),
      gender,
      roleTitle: roleTitle.trim() || 'Stylist',
      phone: phone.trim() || '+971 54 429 8306',
      avatar: avatar.trim() || AVATAR_PRESETS[0],
      rating: 5.0,
      reviewsCount: 1,
      experienceYears: Number(experienceYears),
      specialties: specialties.length > 0 ? specialties : ['Precision Styling'],
      shiftHours: shiftHours.trim() || '09:00 AM - 07:00 PM',
      isAvailable: true,
      workingDays: workingDays.length > 0 ? workingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    };

    if (editingStaffId) {
      updateStaffMember(editingStaffId, staffData);
      setNotificationMsg(`Staff profile "${name}" updated!`);
    } else {
      addStaffMember(staffData);
      setNotificationMsg(`Stylist "${name}" added to roster!`);
    }

    setModalOpen(false);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const toggleAvailability = (st: StaffMember) => {
    updateStaffMember(st.id, {
      isAvailable: !st.isAvailable,
    });
  };

  const toggleWorkingDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const filteredStaff = salonStaff.filter(st => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.gender && st.gender.toLowerCase().includes(searchQuery.toLowerCase())) ||
      st.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDay = filterDay === 'all' || st.workingDays.includes(filterDay);

    return matchesSearch && matchesDay;
  });

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Staff
          </h1>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 text-sm font-black px-2"
          >
            ✕
          </button>
        </div>
      )}

      <div
        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stylists by name, role, gender, or specialty..."
            className={`w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border focus:outline-none transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
            }`}
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          <button
            type="button"
            onClick={() => setFilterDay('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              filterDay === 'all'
                ? 'text-white'
                : isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
            style={{
              backgroundColor: filterDay === 'all' ? currentThemeConfig.primaryHex : undefined,
            }}
          >
            All Days
          </button>
          {allDays.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setFilterDay(d)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                filterDay === d
                  ? 'text-white'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
              style={{
                backgroundColor: filterDay === d ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Add Staff Member Action (Left Aligned above Stylist banner cards) */}
      <div className="flex items-center justify-start">
        <button
          id="add-new-staff-btn"
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 cursor-pointer shrink-0"
          style={{
            backgroundColor: currentThemeConfig.primaryHex,
            boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
          }}
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Staff Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStaff.map(st => (
          <div
            key={st.id}
            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
              isLight
                ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <StaffAvatar
                name={st.name}
                avatar={st.avatar}
                gender={st.gender}
                size="lg"
                badge={
                  <button
                    type="button"
                    onClick={() => toggleAvailability(st)}
                    title={st.isAvailable ? 'Click to set on break' : 'Click to set available'}
                    className={`w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold shadow-xs transition-transform hover:scale-110 ${
                      st.isAvailable ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {st.isAvailable ? '✓' : '✕'}
                  </button>
                }
              />

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className={`text-base font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {st.name}
                    </h3>
                    {st.gender && (
                      <span
                        className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${
                          st.gender === 'Female'
                            ? 'bg-pink-500/10 border-pink-500/20 text-pink-600 dark:text-pink-400'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {st.gender}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {st.rating.toFixed(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(st)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Staff"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStaffMember(st.id)}
                      className="p-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
                      title="Remove Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p
                  className="text-xs font-bold truncate"
                  style={{ color: currentThemeConfig.primaryHex }}
                >
                  {st.roleTitle}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>{st.phone || '+971 54 429 8306'}</span>
                  <span>•</span>
                  <span>{st.shiftHours || '09:00 AM - 07:00 PM'}</span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1.5">
                  {st.specialties.map(spec => (
                    <span
                      key={spec}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border text-xs grid grid-cols-2 gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950/80 border-slate-800/80'
            }`}>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Daily Shift Hours
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {st.shiftHours || '09:00 AM - 07:00 PM'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Booking Status
                </span>
                <span className={`font-bold inline-flex items-center gap-1 mt-0.5 ${
                  st.isAvailable ? 'text-emerald-500' : 'text-rose-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {st.isAvailable ? 'On Duty (Active)' : 'On Break / Off'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-3xl border overflow-y-auto shadow-2xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121316] border-slate-800 text-white'
            }`}
          >
            <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md bg-inherit">
              <div>
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: currentThemeConfig.primaryHex }}
                >
                  {editingStaffId ? 'Update Stylist' : 'New Specialist'}
                </span>
                <h3 className="text-lg font-black tracking-tight">
                  {editingStaffId ? 'Edit Stylist Profile' : 'Add Team Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Full Name & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Stylist Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Gender *
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    {(['Male', 'Female'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-1.5 rounded-xl font-bold transition-all text-center ${
                          gender === g
                            ? 'text-white shadow-xs'
                            : isLight
                            ? 'text-slate-600'
                            : 'text-slate-400'
                        }`}
                        style={{
                          backgroundColor: gender === g ? currentThemeConfig.primaryHex : undefined,
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Role Title & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Role / Professional Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    placeholder="e.g. Master Barber & Founder"
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Experience (Yrs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={experienceYears}
                    onChange={e => setExperienceYears(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-mono font-bold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Phone & Shift Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+971 54 429 8306"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-2xl border text-xs font-mono outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Working Shift Hours
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={shiftHours}
                      onChange={e => setShiftHours(e.target.value)}
                      placeholder="09:00 AM - 07:00 PM"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-2xl border text-xs font-mono outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Specialties (Comma Separated)
                </label>
                <input
                  type="text"
                  value={specialtiesText}
                  onChange={e => setSpecialtiesText(e.target.value)}
                  placeholder="e.g. Skin Fades, Beard Sculpt, Scissor Artistry, Hot Towel"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                />
              </div>

              {/* Working Days */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Available Working Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allDays.map(day => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'text-white shadow-xs'
                            : isLight
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                        style={{
                          backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Presets */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2">
                  Select Profile Avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {AVATAR_PRESETS.map((p, idx) => (
                    <img
                      key={idx}
                      src={p}
                      alt={`preset-${idx}`}
                      onClick={() => setAvatar(p)}
                      className={`w-12 h-12 rounded-2xl object-cover cursor-pointer transition-transform hover:scale-105 border-2 ${
                        avatar === p
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-105'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold border transition-colors ${
                    isLight
                      ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: currentThemeConfig.primaryHex,
                    boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
                  }}
                >
                  {editingStaffId ? 'Save Changes' : 'Add Stylist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

