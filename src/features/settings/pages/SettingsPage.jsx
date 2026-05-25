import { useEffect, useState } from "react";
import SettingsSection from "../components/SettingsSection";
import Toggle from "../components/Toggle";

const defaultSettings = {
  firmName: "Cabinet Aït El Hadj",
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
  const [settings, setSettings] = useState(defaultSettings);
  const [savedSettings, setSavedSettings] = useState(defaultSettings);
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

  const setSetting = key => event => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const setUser = key => event => {
    const value = key === "is_active" ? event.target.checked : event.target.value;
    setUserForm(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    setSavedSettings(settings);
    onToast("Settings saved.");
  };

  const resetSettings = () => {
    setSettings(savedSettings);
    onToast("Changes reset.");
  };

  const createUser = async () => {
    if (!userForm.username || !userForm.password) return;
    try {
      const user = await usersService.create(userForm);
      setUsers(prev => [...prev, user]);
      setUserForm(emptyUserForm);
      onToast("User account created.");
    } catch {
      onToast("Could not create user.");
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
      onToast("User updated.");
    } catch {
      onToast("Could not update user.");
    }
  };

  const resetPassword = async () => {
    if (!resetTarget || newPassword.length < 8) return;
    try {
      await usersService.resetPassword(resetTarget.id, newPassword);
      setResetTarget(null);
      setNewPassword("");
      onToast("Password reset.");
    } catch {
      onToast("Could not reset password.");
    }
  };

  return (
    <div className="settings-grid">
      <SettingsSection title="Profil cabinet" description="Informations générales affichées dans l’espace cabinet.">
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nom du cabinet</label><input className="form-control" value={settings.firmName} onChange={setSetting("firmName")} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={settings.email} onChange={setSetting("email")} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Téléphone</label><input className="form-control" value={settings.phone} onChange={setSetting("phone")} /></div>
          <div className="form-group"><label className="form-label">Spécialité</label><input className="form-control" value={settings.specialty} onChange={setSetting("specialty")} /></div>
        </div>
        <div className="form-group"><label className="form-label">Adresse</label><input className="form-control" value={settings.address} onChange={setSetting("address")} /></div>
      </SettingsSection>

      <SettingsSection title="Apparence" description="Préférences visuelles de l’interface.">
        <Toggle checked={settings.darkMode} onChange={setSetting("darkMode")} label="Mode sombre" description="Mock — prêt pour une future persistance." />
        <div className="form-row">
          <div className="form-group"><label className="form-label">Couleur principale</label>
            <select className="form-control" value={settings.primaryColor} onChange={setSetting("primaryColor")}>
              <option value="gold">Doré</option>
              <option value="green">Vert foncé</option>
              <option value="ink">Noir encre</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Langue</label>
            <select className="form-control" value={settings.language} onChange={setSetting("language")}>
              <option value="fr">Français</option>
              <option value="ar">Arabe</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Sécurité" description="Paramètres sensibles du compte courant.">
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nouveau mot de passe</label><input className="form-control" type="password" placeholder="••••••••" /></div>
          <div className="form-group"><label className="form-label">Confirmation</label><input className="form-control" type="password" placeholder="••••••••" /></div>
        </div>
        <Toggle checked={settings.twoFactor} onChange={setSetting("twoFactor")} label="Authentification à deux facteurs" description="Mock activable pour préparer la sécurité avancée." />
      </SettingsSection>

      <SettingsSection title="Notifications" description="Alertes utiles pour le suivi quotidien.">
        <Toggle checked={settings.hearingAlerts} onChange={setSetting("hearingAlerts")} label="Audiences" description="Rappels avant les prochaines audiences." />
        <Toggle checked={settings.documentAlerts} onChange={setSetting("documentAlerts")} label="Documents" description="Notifications lors des nouveaux dépôts." />
        <Toggle checked={settings.taskAlerts} onChange={setSetting("taskAlerts")} label="Tâches" description="Alertes sur les échéances et tâches urgentes." />
      </SettingsSection>

      <SettingsSection title="Comptes équipe" description="Réservé au lawyer : création et gestion des accès internes.">
        <div className="form-row">
          <div className="form-group"><label className="form-label">Username *</label><input className="form-control" value={userForm.username} onChange={setUser("username")} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={userForm.email} onChange={setUser("email")} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Prénom</label><input className="form-control" value={userForm.first_name} onChange={setUser("first_name")} /></div>
          <div className="form-group"><label className="form-label">Nom</label><input className="form-control" value={userForm.last_name} onChange={setUser("last_name")} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Rôle</label>
            <select className="form-control" value={userForm.role} onChange={setUser("role")}>
              <option value="ASSISTANT">Assistant</option>
              <option value="LAWYER">Lawyer</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Mot de passe temporaire *</label><input className="form-control" type="password" value={userForm.password} onChange={setUser("password")} /></div>
        </div>
        <button className="btn btn-primary" onClick={createUser}>Créer le compte</button>

        <div className="settings-users">
          {loadingUsers ? <div className="empty-state"><h3>Chargement des utilisateurs...</h3></div> : users.map(user => (
            <div key={user.id} className="settings-user-row">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-control" value={user.username} onChange={event => setUsers(prev => prev.map(item => item.id === user.id ? { ...item, username: event.target.value } : item))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rôle</label>
                  <select className="form-control" value={user.role} onChange={event => setUsers(prev => prev.map(item => item.id === user.id ? { ...item, role: event.target.value } : item))}>
                    <option value="ASSISTANT">Assistant</option>
                    <option value="LAWYER">Lawyer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="legal-checkbox">
                  <input type="checkbox" checked={user.is_active} onChange={event => setUsers(prev => prev.map(item => item.id === user.id ? { ...item, is_active: event.target.checked } : item))} />
                  <span>Actif</span>
                </label>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => setResetTarget(user)}>Réinitialiser le mot de passe</button>
                  <button className="btn btn-primary btn-sm" onClick={() => saveUser(user)} disabled={user.id === currentUser.id && !user.is_active}>Enregistrer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Actions" description="Enregistrer, annuler ou quitter la session.">
        <div className="flex gap-2 settings-actions">
          <button className="btn btn-primary" onClick={saveSettings}>Save Changes</button>
          <button className="btn btn-ghost" onClick={resetSettings}>Reset</button>
          <button className="btn btn-danger" onClick={onLogout}>Logout</button>
        </div>
      </SettingsSection>

      {resetTarget && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h3 className="modal-title">Réinitialiser le mot de passe</h3></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe pour {resetTarget.username}</label>
                <input className="form-control" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setResetTarget(null); setNewPassword(""); }}>Annuler</button>
              <button className="btn btn-primary" onClick={resetPassword}>Réinitialiser</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
