import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";
import SettingsSection from "../components/SettingsSection";
import Toggle from "../components/Toggle";

const defaultSettings = {
  firmName: "Cabinet Ait El Hadj",
  email: "contact@aitelhadj-avocat.com",
  phone: "+212 5 22 00 00 00",
  address: "Casablanca, Maroc",
  specialty: "Droit civil et commercial",
  darkMode: true,
  primaryColor: "gold",
  language: "fr",
  twoFactor: false,
  hearingAlerts: true,
  documentAlerts: true,
  taskAlerts: true,
};

const emptyUserForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  role: "ASSISTANT",
  password: "",
  is_active: true,
};

export default function SettingsPage({ usersService, currentUser, onToast, onLogout }) {
  const { language, languages, setLanguage, t } = useI18n();
  const [settings, setSettings] = useState({ ...defaultSettings, language });
  const [savedSettings, setSavedSettings] = useState({ ...defaultSettings, language });
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    let mounted = true;
    usersService.getAll()
      .then(data => mounted && setUsers(data))
      .finally(() => mounted && setLoadingUsers(false));
    return () => {
      mounted = false;
    };
  }, [usersService]);

  useEffect(() => {
    setSettings(prev => ({ ...prev, language }));
  }, [language]);

  const setSetting = key => event => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === "language") setLanguage(value);
  };

  const setUser = key => event => {
    const value = key === "is_active" ? event.target.checked : event.target.value;
    setUserForm(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    setSavedSettings(settings);
    onToast(t("settings.saved"));
  };

  const resetSettings = () => {
    setSettings(savedSettings);
    setLanguage(savedSettings.language);
    onToast(t("settings.reset"));
  };

  const createUser = async () => {
    if (!userForm.username || !userForm.password) return;
    try {
      const user = await usersService.create(userForm);
      setUsers(prev => [...prev, user]);
      setUserForm(emptyUserForm);
      onToast(t("settings.userCreated"));
    } catch {
      onToast(t("settings.userCreateError"));
    }
  };

  const saveUser = async (user) => {
    try {
      const updated = await usersService.update(user.id, {
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active,
      });
      setUsers(prev => prev.map(item => item.id === user.id ? updated : item));
      onToast(t("settings.userUpdated"));
    } catch {
      onToast(t("settings.userUpdateError"));
    }
  };

  const resetPassword = async () => {
    if (!resetTarget || newPassword.length < 8) return;
    try {
      await usersService.resetPassword(resetTarget.id, newPassword);
      setResetTarget(null);
      setNewPassword("");
      onToast(t("settings.passwordReset"));
    } catch {
      onToast(t("settings.passwordResetError"));
    }
  };

  return (
    <div className="settings-grid">
      <SettingsSection title={t("settings.firmProfile")} description={t("settings.firmProfileDesc")}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t("settings.firmName")}</label><input className="form-control" value={settings.firmName} onChange={setSetting("firmName")} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={settings.email} onChange={setSetting("email")} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t("settings.phone")}</label><input className="form-control" value={settings.phone} onChange={setSetting("phone")} /></div>
          <div className="form-group"><label className="form-label">{t("settings.specialty")}</label><input className="form-control" value={settings.specialty} onChange={setSetting("specialty")} /></div>
        </div>
        <div className="form-group"><label className="form-label">{t("settings.address")}</label><input className="form-control" value={settings.address} onChange={setSetting("address")} /></div>
      </SettingsSection>

      <SettingsSection title={t("settings.appearance")} description={t("settings.appearanceDesc")}>
        <Toggle checked={settings.darkMode} onChange={setSetting("darkMode")} label={t("settings.darkMode")} description={t("settings.darkModeDesc")} />
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t("settings.primaryColor")}</label>
            <select className="form-control" value={settings.primaryColor} onChange={setSetting("primaryColor")}>
              <option value="gold">{t("settings.gold")}</option>
              <option value="green">{t("settings.green")}</option>
              <option value="ink">{t("settings.ink")}</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">{t("settings.language")}</label>
            <select className="form-control" value={settings.language} onChange={setSetting("language")}>
              {languages.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title={t("settings.security")} description={t("settings.securityDesc")}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t("settings.newPassword")}</label><input className="form-control" type="password" placeholder="••••••••" /></div>
          <div className="form-group"><label className="form-label">{t("settings.confirmation")}</label><input className="form-control" type="password" placeholder="••••••••" /></div>
        </div>
        <Toggle checked={settings.twoFactor} onChange={setSetting("twoFactor")} label={t("settings.twoFactor")} description={t("settings.twoFactorDesc")} />
      </SettingsSection>

      <SettingsSection title={t("notifications.title")} description={t("settings.notificationsDesc")}>
        <Toggle checked={settings.hearingAlerts} onChange={setSetting("hearingAlerts")} label={t("settings.hearings")} description={t("settings.hearingsDesc")} />
        <Toggle checked={settings.documentAlerts} onChange={setSetting("documentAlerts")} label={t("nav.documents")} description={t("settings.documentsDesc")} />
        <Toggle checked={settings.taskAlerts} onChange={setSetting("taskAlerts")} label={t("nav.tasks")} description={t("settings.tasksDesc")} />
      </SettingsSection>

      <SettingsSection title={t("settings.teamAccounts")} description={t("settings.teamAccountsDesc")}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t("settings.username")} *</label><input className="form-control" value={userForm.username} onChange={setUser("username")} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={userForm.email} onChange={setUser("email")} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t("settings.firstName")}</label><input className="form-control" value={userForm.first_name} onChange={setUser("first_name")} /></div>
          <div className="form-group"><label className="form-label">{t("settings.lastName")}</label><input className="form-control" value={userForm.last_name} onChange={setUser("last_name")} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t("settings.role")}</label>
            <select className="form-control" value={userForm.role} onChange={setUser("role")}>
              <option value="ASSISTANT">Assistant</option>
              <option value="LAWYER">Lawyer</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">{t("settings.tempPassword")} *</label><input className="form-control" type="password" value={userForm.password} onChange={setUser("password")} /></div>
        </div>
        <button className="btn btn-primary" onClick={createUser}>{t("settings.createAccount")}</button>

        <div className="settings-users">
          {loadingUsers ? <div className="empty-state"><h3>{t("settings.loadingUsers")}</h3></div> : users.map(user => (
            <div key={user.id} className="settings-user-row">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("settings.username")}</label>
                  <input className="form-control" value={user.username} onChange={event => setUsers(prev => prev.map(item => item.id === user.id ? { ...item, username: event.target.value } : item))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("settings.role")}</label>
                  <select className="form-control" value={user.role} onChange={event => setUsers(prev => prev.map(item => item.id === user.id ? { ...item, role: event.target.value } : item))}>
                    <option value="ASSISTANT">Assistant</option>
                    <option value="LAWYER">Lawyer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="legal-checkbox">
                  <input type="checkbox" checked={user.is_active} onChange={event => setUsers(prev => prev.map(item => item.id === user.id ? { ...item, is_active: event.target.checked } : item))} />
                  <span>{t("settings.active")}</span>
                </label>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => setResetTarget(user)}>{t("settings.resetPassword")}</button>
                  <button className="btn btn-primary btn-sm" onClick={() => saveUser(user)} disabled={user.id === currentUser.id && !user.is_active}>{t("ui.save")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title={t("settings.actions", "Actions")} description={t("settings.actionsDesc")}>
        <div className="flex gap-2 settings-actions">
          <button className="btn btn-primary" onClick={saveSettings}>{t("settings.saveChanges")}</button>
          <button className="btn btn-ghost" onClick={resetSettings}>{t("settings.resetButton", "Reset")}</button>
          <button className="btn btn-danger" onClick={onLogout}>{t("common.logout")}</button>
        </div>
      </SettingsSection>

      {resetTarget && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h3 className="modal-title">{t("settings.resetPassword")}</h3></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t("settings.resetPasswordFor")} {resetTarget.username}</label>
                <input className="form-control" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setResetTarget(null); setNewPassword(""); }}>{t("ui.cancel")}</button>
              <button className="btn btn-primary" onClick={resetPassword}>{t("settings.resetPassword")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
