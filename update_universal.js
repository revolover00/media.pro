import fs from 'fs';

let render = fs.readFileSync('src/routes/renderActiveTab.tsx', 'utf8');
let dashboard = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Insert the Lazy import
render = render.replace(
  "const ShareMenu = React.lazy(() => import('../components/tools/utilities/ShareMenu').then(module => ({ default: module.ShareMenu })));",
  "const ShareMenu = React.lazy(() => import('../components/tools/utilities/ShareMenu').then(module => ({ default: module.ShareMenu })));\nconst UniversalConverter = React.lazy(() => import('../components/tools/utilities/UniversalConverter').then(module => ({ default: module.UniversalConverter })));"
);

// Insert the case
render = render.replace(
  "    case 'share-menu':\n      return <ShareMenu lang={settingsLanguage} />;",
  "    case 'share-menu':\n      return <ShareMenu lang={settingsLanguage} />;\n    case 'universal-converter':\n      return <UniversalConverter lang={settingsLanguage} onAddHistoryItem={handleAddHistoryItem} />;"
);

fs.writeFileSync('src/routes/renderActiveTab.tsx', render);

const toolObj = `    {
      id: 'universal-converter' as TabId,
      label: isAr ? "المحول الشامل لكافة التنسيقات" : "Universal Format Converter",
      descAr: "تحويل جميع الملفات والتنسيقات من وإلى أي نوع متاح محلياً بسلاسة.",
      descEn: "Convert literally all extensions from any file format to your target format effortlessly.",
      icon: RefreshCw,
      color: "from-blue-600 to-indigo-700",
      bgLight: "bg-blue-50 border-blue-100 text-blue-700",
      category: "utilities" as const
    },`;

// Add to Dashboard
dashboard = dashboard.replace("const toolsData = [", "const toolsData = [\n" + toolObj);
fs.writeFileSync('src/components/Dashboard.tsx', dashboard);

const sidebarToolObj = `    {
      id: 'universal-converter' as TabId,
      label: t.sidebar.universalConverter || "المحول الشامل لكافة التنسيقات",
      icon: RefreshCw,
      category: 'utilities'
    },`;

// Add to Sidebar
sidebar = sidebar.replace("    {", sidebarToolObj + "\n    {");
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);

console.log("Done adding universal-converter");
