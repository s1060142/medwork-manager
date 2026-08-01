// src/components/UserManagement.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { apiGet, apiSend } from "../services/apiClient";
var ROLES = ["Admin", "Doctor", "Secretary", "Rspp", "Employer", "Worker"];
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", role: "Worker", email: "", taxCode: "" });
  const [formError, setFormError] = useState("");
  const [pwDialog, setPwDialog] = useState(false);
  const [pwTarget, setPwTarget] = useState(null);
  const [newPw, setNewPw] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/api/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Errore nel caricamento utenti.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const openCreate = () => {
    setEditing(null);
    setForm({ username: "", password: "", role: "Worker", email: "", taxCode: "" });
    setFormError("");
    setDialogOpen(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ username: u.username, password: "", role: u.role, email: u.email || "", taxCode: u.taxCode || "" });
    setFormError("");
    setDialogOpen(true);
  };
  const save = async () => {
    setFormError("");
    if (!form.username.trim()) {
      setFormError("Inserisci uno username.");
      return;
    }
    if (!editing && !form.password) {
      setFormError("Inserisci una password iniziale.");
      return;
    }
    try {
      if (editing) {
        await apiSend("PUT", `/api/admin/users/${editing.id}`, {
          role: form.role,
          email: form.email || null,
          taxCode: form.taxCode || null,
          isActive: editing.isActive
        });
      } else {
        await apiSend("POST", "/api/admin/users", {
          username: form.username.trim(),
          password: form.password,
          role: form.role,
          email: form.email || null,
          taxCode: form.taxCode || null
        });
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      setFormError(e.message || "Salvataggio fallito.");
    }
  };
  const deactivate = async (u) => {
    if (!window.confirm(`Disattivare l'utente "${u.username}"? Potr\xE0 essere riattivato in seguito.`)) return;
    try {
      await apiSend("DELETE", `/api/admin/users/${u.id}`);
      await load();
    } catch (e) {
      setError(e.message || "Disattivazione fallita.");
    }
  };
  const openChangePw = (u) => {
    setPwTarget(u);
    setNewPw("");
    setPwDialog(true);
  };
  const changePw = async () => {
    if (newPw.length < 8) {
      alert("La password deve essere di almeno 8 caratteri.");
      return;
    }
    try {
      await apiSend("POST", `/api/admin/users/${pwTarget.id}/change-password`, { newPassword: newPw });
      setPwDialog(false);
      await load();
    } catch (e) {
      alert(e.message || "Cambio password fallito.");
    }
  };
  return /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 2 } }, /* @__PURE__ */ React.createElement(Typography, { variant: "h6" }, "Gestione utenti"), /* @__PURE__ */ React.createElement(Button, { variant: "contained", startIcon: /* @__PURE__ */ React.createElement(AddIcon, null), onClick: openCreate }, "Nuovo utente")), error && /* @__PURE__ */ React.createElement(Typography, { color: "error", sx: { mb: 2 } }, error), loading && /* @__PURE__ */ React.createElement(Typography, null, "Caricamento\u2026"), !loading && /* @__PURE__ */ React.createElement(Paper, { variant: "outlined" }, /* @__PURE__ */ React.createElement(Table, { size: "small" }, /* @__PURE__ */ React.createElement(TableHead, null, /* @__PURE__ */ React.createElement(TableRow, null, /* @__PURE__ */ React.createElement(TableCell, null, "Username"), /* @__PURE__ */ React.createElement(TableCell, null, "Ruolo"), /* @__PURE__ */ React.createElement(TableCell, null, "Email"), /* @__PURE__ */ React.createElement(TableCell, null, "Stato"), /* @__PURE__ */ React.createElement(TableCell, null, "Ultimo accesso"), /* @__PURE__ */ React.createElement(TableCell, { align: "right" }, "Azioni"))), /* @__PURE__ */ React.createElement(TableBody, null, users.map((u) => /* @__PURE__ */ React.createElement(TableRow, { key: u.id }, /* @__PURE__ */ React.createElement(TableCell, null, u.username), /* @__PURE__ */ React.createElement(TableCell, null, u.role), /* @__PURE__ */ React.createElement(TableCell, null, u.email || "\u2014"), /* @__PURE__ */ React.createElement(TableCell, null, /* @__PURE__ */ React.createElement(
    Chip,
    {
      size: "small",
      label: u.isActive ? "Attivo" : "Disattivato",
      color: u.isActive ? "success" : "default",
      variant: u.isActive ? "filled" : "outlined"
    }
  ), u.mustChangePassword && /* @__PURE__ */ React.createElement(Chip, { size: "small", label: "Cambio pwd", color: "warning", sx: { ml: 1 } })), /* @__PURE__ */ React.createElement(TableCell, null, u.lastLoginAtUtc ? new Date(u.lastLoginAtUtc).toLocaleString("it-IT") : "mai"), /* @__PURE__ */ React.createElement(TableCell, { align: "right" }, /* @__PURE__ */ React.createElement(IconButton, { size: "small", onClick: () => openChangePw(u), title: "Cambia password" }, /* @__PURE__ */ React.createElement(EditIcon, { fontSize: "small" })), /* @__PURE__ */ React.createElement(IconButton, { size: "small", onClick: () => openEdit(u), title: "Modifica" }, /* @__PURE__ */ React.createElement(EditIcon, { fontSize: "small" })), /* @__PURE__ */ React.createElement(IconButton, { size: "small", color: "error", onClick: () => deactivate(u), title: "Disattiva" }, /* @__PURE__ */ React.createElement(DeleteOutlineIcon, { fontSize: "small" }))))), users.length === 0 && /* @__PURE__ */ React.createElement(TableRow, null, /* @__PURE__ */ React.createElement(TableCell, { colSpan: 6, align: "center" }, "Nessun utente."))))), /* @__PURE__ */ React.createElement(Dialog, { open: dialogOpen, onClose: () => setDialogOpen(false), maxWidth: "xs", fullWidth: true }, /* @__PURE__ */ React.createElement(DialogTitle, null, editing ? `Modifica ${editing.username}` : "Nuovo utente"), /* @__PURE__ */ React.createElement(DialogContent, null, /* @__PURE__ */ React.createElement(Stack, { spacing: 2, sx: { mt: 1 } }, /* @__PURE__ */ React.createElement(
    TextField,
    {
      label: "Username",
      size: "small",
      value: form.username,
      disabled: !!editing,
      onChange: (e) => setForm({ ...form, username: e.target.value })
    }
  ), !editing && /* @__PURE__ */ React.createElement(
    TextField,
    {
      label: "Password iniziale",
      type: "password",
      size: "small",
      value: form.password,
      onChange: (e) => setForm({ ...form, password: e.target.value })
    }
  ), /* @__PURE__ */ React.createElement(
    TextField,
    {
      select: true,
      label: "Ruolo",
      size: "small",
      value: form.role,
      onChange: (e) => setForm({ ...form, role: e.target.value })
    },
    ROLES.map((r) => /* @__PURE__ */ React.createElement(MenuItem, { key: r, value: r }, r))
  ), /* @__PURE__ */ React.createElement(
    TextField,
    {
      label: "Email",
      size: "small",
      value: form.email,
      onChange: (e) => setForm({ ...form, email: e.target.value })
    }
  ), /* @__PURE__ */ React.createElement(
    TextField,
    {
      label: "Codice fiscale / P.IVA",
      size: "small",
      value: form.taxCode,
      helperText: "Per portali lavoratore/azienda",
      onChange: (e) => setForm({ ...form, taxCode: e.target.value })
    }
  ), formError && /* @__PURE__ */ React.createElement(Typography, { color: "error", variant: "body2" }, formError))), /* @__PURE__ */ React.createElement(DialogActions, null, /* @__PURE__ */ React.createElement(Button, { onClick: () => setDialogOpen(false) }, "Annulla"), /* @__PURE__ */ React.createElement(Button, { variant: "contained", onClick: save }, "Salva"))), /* @__PURE__ */ React.createElement(Dialog, { open: pwDialog, onClose: () => setPwDialog(false), maxWidth: "xs", fullWidth: true }, /* @__PURE__ */ React.createElement(DialogTitle, null, "Cambia password: ", pwTarget?.username), /* @__PURE__ */ React.createElement(DialogContent, null, /* @__PURE__ */ React.createElement(
    TextField,
    {
      label: "Nuova password (min 8)",
      type: "password",
      fullWidth: true,
      size: "small",
      sx: { mt: 1 },
      value: newPw,
      onChange: (e) => setNewPw(e.target.value)
    }
  )), /* @__PURE__ */ React.createElement(DialogActions, null, /* @__PURE__ */ React.createElement(Button, { onClick: () => setPwDialog(false) }, "Annulla"), /* @__PURE__ */ React.createElement(Button, { variant: "contained", onClick: changePw }, "Aggiorna"))));
}
export {
  UserManagement as default
};
