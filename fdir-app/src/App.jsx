import { useState } from "react";
import { AppProvider, useApp } from "./AppContext";
import Layout           from "./Layout";
import Landing          from "./Landing";
import SelfTestPanel    from "./SelfTestPanel";
import PageDashboard    from "./PageDashboard";
import PageSensors      from "./PageSensors";
import PageStateMachine from "./PageStateMachine";
import PageReplay       from "./PageReplay";
import PageCrashReports from "./PageCrashReports";

function Router() {
  const { page } = useApp();
  switch (page) {
    case "dashboard":     return <PageDashboard/>;
    case "sensors":       return <PageSensors/>;
    case "state-machine": return <PageStateMachine/>;
    case "replay":        return <PageReplay/>;
    case "crash-reports": return <PageCrashReports/>;
    case "self-test": return <SelfTestPanel inline />;
    default:              return <PageDashboard/>;
  }
}

function AppShell() {
  return (
    <Layout>
      <Router/>
    </Layout>
  );
}

export default function App() {
  const [launched, setLaunched] = useState(false);

  if (!launched) return <Landing onEnter={() => setLaunched(true)}/>;

  return (
    <AppProvider>
      <AppShell/>
    </AppProvider>
  );
}