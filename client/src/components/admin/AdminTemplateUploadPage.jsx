import { useState } from "react";
import { IconLibrary, IconSparkles, IconUpload } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import TemplateGeneratorPanel from "./templates/TemplateGeneratorPanel.jsx";
import TemplateUploadPanel from "./templates/TemplateUploadPanel.jsx";
import TemplateLibraryPanel from "./templates/TemplateLibraryPanel.jsx";
import ToastContainer from "../common/Toast.jsx";
import useToast from "../../hooks/useToast.js";
import "../../styles/admin-template-upload.css";
import "../../styles/admin-templates.css";
import "../../styles/admin-broadcast-page.css";

const TABS = [
  { key: "generate", label: "Generate with AI", icon: IconSparkles },
  { key: "upload", label: "Upload HTML File", icon: IconUpload },
  { key: "library", label: "Library", icon: IconLibrary },
];

export default function AdminTemplateUploadPage() {
  const [activeTab, setActiveTab] = useState("generate");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { toasts, pushToast, dismissToast } = useToast();

  // Shared by Generate/Upload panels: show a toast, then jump to the Library so the admin
  // immediately sees their new/updated template in context.
  function handleSaved() {
    setEditingTemplate(null);
    setActiveTab("library");
  }

  function handleEditFromLibrary(template) {
    setEditingTemplate(template);
    setActiveTab("generate");
  }

  function handleTabChange(key) {
    if (key !== "generate") setEditingTemplate(null);
    setActiveTab(key);
  }

  return (
    <AdminLayout
      pageTitle="Templates"
      pageSubtitle="Generate, upload, and manage HTML email templates for broadcasts."
    >
      <div className="admin-templates">
        <div className="admin-templates__tabs" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`admin-templates__tab${activeTab === tab.key ? " admin-templates__tab--active" : ""}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="admin-templates__panel">
          {activeTab === "generate" ? (
            <TemplateGeneratorPanel
              key={editingTemplate?.id || "new"}
              editingTemplate={editingTemplate}
              onSaved={handleSaved}
              pushToast={pushToast}
            />
          ) : null}
          {activeTab === "upload" ? <TemplateUploadPanel onSaved={handleSaved} pushToast={pushToast} /> : null}
          {activeTab === "library" ? (
            <TemplateLibraryPanel onEdit={handleEditFromLibrary} pushToast={pushToast} />
          ) : null}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminLayout>
  );
}
