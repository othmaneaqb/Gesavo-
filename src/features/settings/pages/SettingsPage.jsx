import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";
import SettingsSection from "../components/SettingsSection";

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
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersUnavailable, setUsersUnavailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    usersService.getAll()
      .then(data => {
        if (mounted) setUsers(data);
      })
      .catch(() => {
        if (mounted) setUsersUnavailable(true);
      })
      .finally(() => {
        if (mounted) setLoadingUsers(false);
      });
    return () => {
      mounted = false;
    };
  }, [usersService]);

  const setUser = key => event => {
    const value = key === "is_active" ? event.target.checked : event.target.value;
    setUserForm(prev => ({ ...prev, [key]: value }));
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

  const saveUser = async user => {
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
    if (!resetTarget || newPassword.length < 12) return;
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
      <SettingsSection
        title={t("settings.interfaceLanguage")}
        description={t("settings.interfaceLanguageDesc")}
      >
        <div className="form-group">
          <label className="form-label">{t("settings.language")}</label>
          <select
            className="form-control"
            value={language}
            onChange={event => setLanguage(event.target.value)}
          >
            {languages.map(item => (
              <option key={item.code} value={item.code}>{item.name}</option>
            ))}
          </select>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t("settings.teamAccounts")}
        description={t("settings.teamAccountsDesc")}
      >
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
              <option value="ASSISTANT">{t("settings.roleAssistant")}</option>
              <option value="LAWYER">{t("settings.roleLawyer")}</option>
              <option value="ADMIN">{t("settings.roleAdmin")}</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">{t("settings.tempPassword")} *</label><input className="form-control" type="password" minLength={12} value={userForm.password} onChange={setUser("password")} /></div>
        </div>
        <button className="btn btn-primary" onClick={createUser}>{t("settings.createAccount")}</button>

        <div className="settings-users">
          {loadingUsers && <div className="empty-state"><h3>{t("settings.loadingUsers")}</h3></div>}
          {usersUnavailable && <div className="empty-state"><h3>{t("settings.usersUnavailable")}</h3></div>}
          {!loadingUsers && !usersUnavailable && users.map(user => (
            <div key={user.id} className="settings-user-row">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("settings.username")}</label>
                  <input className="form-control" value={user.username} onChange={event => setUsers(prev => prev.map(item => item.id === user.id ? { ...item, username: event.target.value } : item))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("settings.role")}</label>
                  <select className="form-control" value={user.role} disabled={user.id === currentUser.id} onChange={event => setUsers(prev => prev.map(item => item.id === user.id ? { ...item, role: event.target.value } : item))}>
                    <option value="ASSISTANT">{t("settings.roleAssistant")}</option>
                    <option value="LAWYER">{t("settings.roleLawyer")}</option>
                    <option value="ADMIN">{t("settings.roleAdmin")}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="legal-checkbox">
                  <input type="checkbox" checked={user.is_active} disabled={user.id === currentUser.id} onChange={event => setUsers(prev => prev.map(item => item.id === user.id ? { ...item, is_active: event.target.checked } : item))} />
                  <span>{t("settings.active")}</span>
                </label>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => setResetTarget(user)}>{t("settings.resetPassword")}</button>
                  <button className="btn btn-primary btn-sm" onClick={() => saveUser(user)}>{t("ui.save")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title={t("settings.actions")} description={t("settings.actionsDesc")}>
        <div className="settings-actions">
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
                <input className="form-control" type="password" minLength={12} value={newPassword} onChange={event => setNewPassword(event.target.value)} />
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
