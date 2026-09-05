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
  const [commissionRate, setCommissionRate] = useState(40);
  const [workingDays, setWorkingDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleOpenAddModal = () => {
    setEditingStaffId(null);
    setName('');
    setGender('Male');
    setRoleTitle('Senior Barber & Stylist');
    setPhone('+971 54 429 8306');
    setAvatar(AVATAR_PRESETS[0]);
    setSpecialtiesText('Skin Fades, Beard Sculpting, Hot Towel Shave');
    setShiftHours('09:00 AM - 07:00 PM');
    setExperienceYears(5);
    setCommissionRate(40);
    setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    setModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setName(staff.name);
    setGender((staff.gender as 'Male' | 'Female') || 'Male');
    setRoleTitle(staff.roleTitle || 'Senior Barber');
    setPhone(staff.phone || '+971 54 429 8306');
    setAvatar(staff.avatar || AVATAR_PRESETS[0]);
    setSpecialtiesText(staff.specialties ? staff.specialties.join(', ') : 'Skin Fades');
    setShiftHours(staff.shiftHours || '09:00 AM - 07:00 PM');
    setExperienceYears(staff.experienceYears || 5);
    setCommissionRate(staff.commissionRate || 40);
    setWorkingDays(staff.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    setModalOpen(true);
  };

  const handleToggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const specsArray = specialtiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingStaffId) {
      updateStaffMember(editingStaffId, {
        name: name.trim(),
        gender,
        roleTitle: roleTitle.trim(),
        phone: phone.trim(),
        avatar,
        specialties: specsArray.length > 0 ? specsArray : ['General Hair Care'],
        shiftHours: shiftHours.trim(),
        experienceYears: Number(experienceYears) || 1,
        commissionRate: Number(commissionRate) || 30,
        workingDays,
      });
      showNotification(`Stylist ${name} profile updated successfully.`);
    } else {
      addStaffMember({
        salonId: salon.id,
        name: name.trim(),
        gender,
        roleTitle: roleTitle.trim(),
        phone: phone.trim(),
        avatar,
        rating: 5.0,
        reviewCount: 0,
        isAvailable: true,
        specialties: specsArray.length > 0 ? specsArray : ['General Hair Care'],
        shiftHours: shiftHours.trim(),
        experienceYears: Number(experienceYears) || 1,
        commissionRate: Number(commissionRate) || 30,
        workingDays,
      });
      showNotification(`New staff member ${name} onboarded.`);
    }

    setModalOpen(false);
  };

  const handleDeleteStaff = (staffId: string) => {
    deleteStaffMember(staffId);
    setDeleteConfirmId(null);
    showNotification('Staff member removed.');
  };

  const handleToggleAvailability = (staff: StaffMember) => {
    updateStaffMember(staff.id, {
      isAvailable: !staff.isAvailable,
    });
    showNotification(
      `${staff.name} is now ${!staff.isAvailable ? 'Available for bookings' : 'Marked Off Duty'}.`
    );
  };

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const filteredStaff = salonStaff.filter(st => {
    const matchSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.roleTitle && st.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.specialties && st.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchDay = filterDay === 'all' || (st.workingDays && st.workingDays.includes(filterDay));

    return matchSearch && matchDay;
  });

  return (
    <div id="business-staff-manager-root" className="space-y-6">
      {/* Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Staff & Stylists</h2>
          <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Manage your barbers, stylists, shift hours, and commission splits
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center gap-2 self-start sm:self-auto active:scale-95"
          style={{ backgroundColor: currentThemeConfig.primaryHex }}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Staff</span>
        </button>
      </div>

      {/* Quick Search & Day Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border flex-1 max-w-md ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stylist by name, specialty, or title..."
            className="w-full bg-transparent text-xs focus:outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Day Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterDay('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              filterDay === 'all'
                ? 'bg-primary text-white border-primary shadow-sm'
                : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
            }`}
            style={filterDay === 'all' ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
          >
            All Days
          </button>
          {allDays.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => setFilterDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                filterDay === day
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : isLight
                  ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
              }`}
              style={filterDay === day ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(st => (
          <div
            key={st.id}
            id={`staff-card-${st.id}`}
            className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              {/* Card Top Header: Avatar + Status Toggle */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <StaffAvatar
                    avatarUrl={st.avatar}
                    name={st.name}
                    isAvailable={st.isAvailable}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-extrabold truncate">{st.name}</h3>
                    <p className={`text-xs truncate font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {st.roleTitle || 'Stylist'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{st.rating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({st.reviewCount || 0})</span>
                    </div>
                  </div>
                </div>

                {/* Duty Switch Button */}
                <button
                  type="button"
                  onClick={() => handleToggleAvailability(st)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                    st.isAvailable
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                  }`}
                  title="Toggle duty status"
                >
                  {st.isAvailable ? 'Available' : 'Off Duty'}
                </button>
              </div>

              {/* Card Middle: Shift, Specialties, Phone */}
              <div className="py-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-semibold">{st.shiftHours || '09:00 AM - 07:00 PM'}</span>
                </div>

                {st.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{st.phone}</span>
                  </div>
                )}

                {/* Specialties Tags */}
                {st.specialties && st.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {st.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          isLight
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-slate-800 text-slate-300 border-slate-750'
                        }`}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {/* Working Days Badges */}
                {st.workingDays && st.workingDays.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {allDays.map(d => {
                      const isWorking = st.workingDays.includes(d);
                      return (
                        <span
                          key={d}
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            isWorking
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'text-slate-400 opacity-40'
                          }`}
                        >
                          {d.slice(0, 2)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer: Edit & Delete Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold text-slate-500">
                <span>{st.commissionRate || 40}% Split</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(st)}
                  className={`p-2 rounded-xl border transition-colors ${
                    isLight
                      ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Edit Staff Member"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {deleteConfirmId === st.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(st.id)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500 text-white"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-1.5 py-1 rounded-lg text-[10px] text-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(st.id)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    title="Delete Staff"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredStaff.length === 0 && (
          <div className="col-span-full text-center py-16 space-y-3">
            <p className="text-slate-400 text-xs">No staff members match your filter criteria.</p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95"
              style={{ backgroundColor: currentThemeConfig.primaryHex }}
            >
              Add First Stylist
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Staff Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-w-lg rounded-3xl border shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-slideUp ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold">
                {editingStaffId ? 'Edit Stylist Profile' : 'Add New Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveStaff} className="space-y-4">
              {/* Name & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as 'Male' | 'Female')}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Role Title & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Role Title</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    placeholder="e.g. Master Stylist"
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+971 50 000 0000"
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Avatar Presets */}
              <div>
                <label className="text-xs font-bold block mb-1.5">Select Profile Avatar</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Avatar option"
                      onClick={() => setAvatar(url)}
                      className={`w-12 h-12 rounded-2xl object-cover cursor-pointer border-2 transition-all shrink-0 ${
                        avatar === url
                          ? 'border-primary ring-2 ring-primary/30 scale-105'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="text-xs font-bold block mb-1">
                  Specialties (comma separated)
                </label>
                <input
                  type="text"
                  value={specialtiesText}
                  onChange={e => setSpecialtiesText(e.target.value)}
                  placeholder="Skin Fades, Balayage, Beard Sculpting, Keratin"
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              {/* Shift Hours & Commission Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Shift Hours</label>
                  <input
                    type="text"
                    value={shiftHours}
                    onChange={e => setShiftHours(e.target.value)}
                    placeholder="09:00 AM - 07:00 PM"
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Commission Split (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={commissionRate}
                    onChange={e => setCommissionRate(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Working Days Multi-Select */}
              <div>
                <label className="text-xs font-bold block mb-1.5">Weekly Working Days</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {allDays.map(day => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : isLight
                            ? 'bg-slate-50 text-slate-600 border-slate-200'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                        style={isSelected ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md active:scale-95"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                >
                  {editingStaffId ? 'Save Changes' : 'Onboard Stylist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
